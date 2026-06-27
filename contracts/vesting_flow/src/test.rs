#![cfg(test)]

use super::*;
use flow_token::{FlowTokenContract, FlowTokenContractClient};
use soroban_sdk::{
    testutils::{Address as _, AuthorizedFunction, Ledger},
    Address, Env,
};

fn setup_test_env(
    env: &Env,
) -> (
    Address,
    Address,
    Address,
    VestingFlowContractClient<'static>,
    FlowTokenContractClient<'static>,
) {
    env.mock_all_auths();

    // Register token contract
    let admin = Address::generate(env);
    let token_id = env.register_contract(None, FlowTokenContract);
    let token_client = FlowTokenContractClient::new(env, &token_id);
    token_client.initialize(&admin);

    // Register vesting contract
    let vesting_id = env.register_contract(None, VestingFlowContract);
    let vesting_client = VestingFlowContractClient::new(env, &vesting_id);

    let depositor = Address::generate(env);
    let beneficiary = Address::generate(env);

    // Mint tokens to depositor
    token_client.mint(&depositor, &1000);

    (
        depositor,
        beneficiary,
        token_id,
        vesting_client,
        token_client,
    )
}

#[test]
fn test_initiate_vesting_locks_deposit() {
    let env = Env::default();
    let (depositor, beneficiary, token_id, vesting_client, token_client) = setup_test_env(&env);

    env.ledger().set_timestamp(100);
    let flow_id = vesting_client.initiate_vesting(&depositor, &beneficiary, &token_id, &100, &10);

    assert_eq!(flow_id, 1);
    assert_eq!(token_client.balance(&depositor), 900);
    assert_eq!(token_client.balance(&vesting_client.address), 100);

    let flow = vesting_client.get_vesting_details(&1);
    assert_eq!(flow.depositor, depositor);
    assert_eq!(flow.beneficiary, beneficiary);
    assert_eq!(flow.principal, 100);
    assert_eq!(flow.commencement, 100);
    assert_eq!(flow.vesting_period, 10);
    assert_eq!(flow.claimed_amount, 0);
    assert_eq!(flow.asset, token_id);
}

#[test]
fn test_unlocked_balance_calculation() {
    let env = Env::default();
    let (depositor, beneficiary, token_id, vesting_client, _) = setup_test_env(&env);

    env.ledger().set_timestamp(100);
    vesting_client.initiate_vesting(&depositor, &beneficiary, &token_id, &100, &10);

    // unlocked_balance returns 0 at t=0
    assert_eq!(vesting_client.unlocked_balance(&1), 0);

    // unlocked_balance returns ~50% at t=duration/2 (t = 105)
    env.ledger().set_timestamp(105);
    assert_eq!(vesting_client.unlocked_balance(&1), 50);

    // unlocked_balance returns 100% at t>=duration (t = 110)
    env.ledger().set_timestamp(110);
    assert_eq!(vesting_client.unlocked_balance(&1), 100);

    // unlocked_balance returns 100% at t = 115 (past duration)
    env.ledger().set_timestamp(115);
    assert_eq!(vesting_client.unlocked_balance(&1), 100);
}

#[test]
fn test_claim_transfers_unlocked_amount() {
    let env = Env::default();
    let (depositor, beneficiary, token_id, vesting_client, token_client) = setup_test_env(&env);

    env.ledger().set_timestamp(100);
    vesting_client.initiate_vesting(&depositor, &beneficiary, &token_id, &100, &10);

    // Move to 50% vesting
    env.ledger().set_timestamp(105);

    // claim correctly transfers vested-and-not-yet-withdrawn amount
    let claimed = vesting_client.claim_unlocked(&1);
    assert_eq!(claimed, 50);

    // Check balances
    assert_eq!(token_client.balance(&beneficiary), 50);
    assert_eq!(token_client.balance(&vesting_client.address), 50);

    // Move to 100% vesting
    env.ledger().set_timestamp(110);
    let claimed_again = vesting_client.claim_unlocked(&1);
    assert_eq!(claimed_again, 50);
    assert_eq!(token_client.balance(&beneficiary), 100);
    assert_eq!(token_client.balance(&vesting_client.address), 0);
}

#[test]
fn test_claim_requires_beneficiary_auth() {
    let env = Env::default();
    let (depositor, beneficiary, token_id, vesting_client, _) = setup_test_env(&env);

    env.ledger().set_timestamp(100);
    vesting_client.initiate_vesting(&depositor, &beneficiary, &token_id, &100, &10);

    env.ledger().set_timestamp(105);

    // Call claim. Because mock_all_auths is on, it succeeds, but we will assert
    // that the beneficiary's authorization was required for the claim call.
    vesting_client.claim_unlocked(&1);

    let auths = env.auths();
    assert_eq!(auths.len(), 1);
    let (auth_address, invocation) = &auths[0];
    assert_eq!(auth_address, &beneficiary);

    match &invocation.function {
        AuthorizedFunction::Contract((address, name, _args)) => {
            assert_eq!(address, &vesting_client.address);
            assert_eq!(name, &soroban_sdk::Symbol::new(&env, "claim_unlocked"));
        }
        _ => panic!("unexpected auth function"),
    }
}

#[test]
#[should_panic]
fn test_initiate_vesting_fails_for_zero_principal() {
    let env = Env::default();
    let (depositor, beneficiary, token_id, vesting_client, _) = setup_test_env(&env);

    vesting_client.initiate_vesting(&depositor, &beneficiary, &token_id, &0, &10);
}

#[test]
#[should_panic]
fn test_initiate_vesting_fails_for_zero_period() {
    let env = Env::default();
    let (depositor, beneficiary, token_id, vesting_client, _) = setup_test_env(&env);

    vesting_client.initiate_vesting(&depositor, &beneficiary, &token_id, &100, &0);
}

#[test]
fn test_revoke_vesting() {
    let env = Env::default();
    let (depositor, beneficiary, token_id, vesting_client, token_client) = setup_test_env(&env);

    env.ledger().set_timestamp(100);
    vesting_client.initiate_vesting(&depositor, &beneficiary, &token_id, &100, &10);

    // Revoke at t=5 (50% vested)
    env.ledger().set_timestamp(105);
    vesting_client.revoke_vesting(&1);

    // Vested (50) should go to beneficiary, remainder (50) should go back to depositor.
    assert_eq!(token_client.balance(&depositor), 950);
    assert_eq!(token_client.balance(&beneficiary), 50);
    assert_eq!(token_client.balance(&vesting_client.address), 0);

    // Verify state has been updated
    let flow = vesting_client.get_vesting_details(&1);
    assert_eq!(flow.principal, 50);
    assert_eq!(flow.vesting_period, 5);
    assert_eq!(flow.claimed_amount, 50);
}

#[test]
fn test_fetch_user_flows_depositor_and_beneficiary() {
    let env = Env::default();
    let (depositor, beneficiary, token_id, vesting_client, _) = setup_test_env(&env);
    let other_beneficiary = Address::generate(&env);

    vesting_client.initiate_vesting(&depositor, &beneficiary, &token_id, &100, &10);
    vesting_client.initiate_vesting(&depositor, &other_beneficiary, &token_id, &100, &10);

    assert_eq!(
        vesting_client.fetch_user_flows(&depositor),
        Vec::from_array(&env, [1, 2])
    );
    assert_eq!(
        vesting_client.fetch_user_flows(&beneficiary),
        Vec::from_array(&env, [1])
    );
    assert_eq!(
        vesting_client.fetch_user_flows(&other_beneficiary),
        Vec::from_array(&env, [2])
    );
}

#[test]
fn test_partial_claims_only_transfer_newly_unlocked_amount() {
    let env = Env::default();
    let (depositor, beneficiary, token_id, vesting_client, token_client) = setup_test_env(&env);

    env.ledger().set_timestamp(100);
    vesting_client.initiate_vesting(&depositor, &beneficiary, &token_id, &100, &10);

    env.ledger().set_timestamp(103);
    assert_eq!(vesting_client.claim_unlocked(&1), 30);

    env.ledger().set_timestamp(107);
    assert_eq!(vesting_client.claim_unlocked(&1), 40);
    assert_eq!(token_client.balance(&beneficiary), 70);
    assert_eq!(vesting_client.get_vesting_details(&1).claimed_amount, 70);
}

#[test]
fn test_revoke_after_partial_claim_settles_remaining_funds() {
    let env = Env::default();
    let (depositor, beneficiary, token_id, vesting_client, token_client) = setup_test_env(&env);

    env.ledger().set_timestamp(100);
    vesting_client.initiate_vesting(&depositor, &beneficiary, &token_id, &100, &10);

    env.ledger().set_timestamp(103);
    vesting_client.claim_unlocked(&1);

    env.ledger().set_timestamp(106);
    vesting_client.revoke_vesting(&1);

    assert_eq!(token_client.balance(&depositor), 940);
    assert_eq!(token_client.balance(&beneficiary), 60);
    assert_eq!(token_client.balance(&vesting_client.address), 0);

    let flow = vesting_client.get_vesting_details(&1);
    assert_eq!(flow.principal, 60);
    assert_eq!(flow.claimed_amount, 60);
}

#[test]
fn test_self_flow_is_listed_only_once() {
    let env = Env::default();
    let (depositor, _, token_id, vesting_client, _) = setup_test_env(&env);

    vesting_client.initiate_vesting(&depositor, &depositor, &token_id, &100, &10);

    assert_eq!(
        vesting_client.fetch_user_flows(&depositor),
        Vec::from_array(&env, [1])
    );
}
