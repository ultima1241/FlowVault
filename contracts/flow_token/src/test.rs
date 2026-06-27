#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

fn setup_token(env: &Env) -> (Address, FlowTokenContractClient<'static>) {
    env.mock_all_auths();
    let admin = Address::generate(env);
    let token_id = env.register(FlowTokenContract, ());
    let token_client = FlowTokenContractClient::new(env, &token_id);
    token_client.initialize(&admin);
    (admin, token_client)
}

#[test]
fn metadata_matches_fvt_token() {
    let env = Env::default();
    let (_, token_client) = setup_token(&env);

    assert_eq!(
        token_client.name(),
        String::from_str(&env, "FlowVault Utility Token")
    );
    assert_eq!(token_client.symbol(), String::from_str(&env, "FVT"));
    assert_eq!(token_client.decimals(), 7);
}

#[test]
fn admin_can_mint_tokens() {
    let env = Env::default();
    let (_, token_client) = setup_token(&env);
    let recipient = Address::generate(&env);

    token_client.mint(&recipient, &250);

    assert_eq!(token_client.balance(&recipient), 250);
}

#[test]
fn transfer_moves_tokens_between_accounts() {
    let env = Env::default();
    let (_, token_client) = setup_token(&env);
    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);
    token_client.mint(&sender, &500);

    token_client.transfer(&sender, &recipient, &175);

    assert_eq!(token_client.balance(&sender), 325);
    assert_eq!(token_client.balance(&recipient), 175);
}

#[test]
#[should_panic(expected = "insufficient balance")]
fn transfer_rejects_insufficient_balance() {
    let env = Env::default();
    let (_, token_client) = setup_token(&env);
    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);

    token_client.transfer(&sender, &recipient, &1);
}
