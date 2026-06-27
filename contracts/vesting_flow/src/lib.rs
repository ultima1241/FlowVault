#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Symbol, Vec};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VestingFlow {
    pub depositor: Address,
    pub beneficiary: Address,
    pub principal: i128,
    pub commencement: u64,
    pub vesting_period: u64,
    pub claimed_amount: i128,
    pub asset: Address,
}

#[contract]
pub struct VestingFlowContract;

#[contractimpl]
impl VestingFlowContract {
    pub fn initiate_vesting(
        env: Env,
        depositor: Address,
        beneficiary: Address,
        asset: Address,
        principal: i128,
        vesting_period: u64,
    ) -> u64 {
        depositor.require_auth();
        if principal <= 0 {
            panic!("principal must be positive");
        }
        if vesting_period <= 0 {
            panic!("vesting_period must be positive");
        }

        let mut counter = env
            .storage()
            .instance()
            .get(&Symbol::new(&env, "flow_counter"))
            .unwrap_or(0u64);
        counter += 1;
        env.storage()
            .instance()
            .set(&Symbol::new(&env, "flow_counter"), &counter);

        let flow = VestingFlow {
            depositor: depositor.clone(),
            beneficiary: beneficiary.clone(),
            principal,
            commencement: env.ledger().timestamp(),
            vesting_period,
            claimed_amount: 0,
            asset: asset.clone(),
        };

        env.storage().persistent().set(&counter, &flow);

        // Index the flow ID for the depositor
        let mut depositor_flows: Vec<u64> = env
            .storage()
            .persistent()
            .get(&(Symbol::new(&env, "depositor_flows"), depositor.clone()))
            .unwrap_or(Vec::new(&env));
        depositor_flows.push_back(counter);
        env.storage().persistent().set(
            &(Symbol::new(&env, "depositor_flows"), depositor.clone()),
            &depositor_flows,
        );

        // Index the flow ID for the beneficiary
        if depositor != beneficiary {
            let mut beneficiary_flows: Vec<u64> = env
                .storage()
                .persistent()
                .get(&(Symbol::new(&env, "beneficiary_flows"), beneficiary.clone()))
                .unwrap_or(Vec::new(&env));
            beneficiary_flows.push_back(counter);
            env.storage().persistent().set(
                &(Symbol::new(&env, "beneficiary_flows"), beneficiary.clone()),
                &beneficiary_flows,
            );
        }

        // Perform inter-contract call to lock principal
        let token_client = soroban_sdk::token::Client::new(&env, &asset);
        token_client.transfer(&depositor, &env.current_contract_address(), &principal);

        env.events().publish(
            (
                Symbol::new(&env, "flow_initiated"),
                counter,
                depositor,
                beneficiary,
            ),
            principal,
        );

        counter
    }

    pub fn get_vesting_details(env: Env, flow_id: u64) -> VestingFlow {
        env.storage()
            .persistent()
            .get(&flow_id)
            .expect("vesting flow not found")
    }

    pub fn unlocked_balance(env: Env, flow_id: u64) -> i128 {
        let flow: VestingFlow = env
            .storage()
            .persistent()
            .get(&flow_id)
            .expect("vesting flow not found");
        let now = env.ledger().timestamp();
        let elapsed = now.saturating_sub(flow.commencement);

        if elapsed >= flow.vesting_period {
            flow.principal
        } else {
            flow.principal * (elapsed as i128) / (flow.vesting_period as i128)
        }
    }

    pub fn claim_unlocked(env: Env, flow_id: u64) -> i128 {
        let mut flow: VestingFlow = env
            .storage()
            .persistent()
            .get(&flow_id)
            .expect("vesting flow not found");
        flow.beneficiary.require_auth();

        let vested = Self::unlocked_balance(env.clone(), flow_id);
        let withdrawable = vested - flow.claimed_amount;
        if withdrawable <= 0 {
            panic!("nothing to claim");
        }

        flow.claimed_amount += withdrawable;
        env.storage().persistent().set(&flow_id, &flow);

        // Perform inter-contract transfer to beneficiary
        let token_client = soroban_sdk::token::Client::new(&env, &flow.asset);
        token_client.transfer(
            &env.current_contract_address(),
            &flow.beneficiary,
            &withdrawable,
        );

        env.events().publish(
            (
                Symbol::new(&env, "claim_executed"),
                flow_id,
                flow.beneficiary.clone(),
            ),
            withdrawable,
        );

        withdrawable
    }

    pub fn revoke_vesting(env: Env, flow_id: u64) {
        let flow: VestingFlow = env
            .storage()
            .persistent()
            .get(&flow_id)
            .expect("vesting flow not found");
        flow.depositor.require_auth();

        let vested = Self::unlocked_balance(env.clone(), flow_id);
        let to_beneficiary = vested - flow.claimed_amount;
        let to_depositor = flow.principal - vested;

        let token_client = soroban_sdk::token::Client::new(&env, &flow.asset);

        if to_beneficiary > 0 {
            token_client.transfer(
                &env.current_contract_address(),
                &flow.beneficiary,
                &to_beneficiary,
            );
        }

        if to_depositor > 0 {
            token_client.transfer(
                &env.current_contract_address(),
                &flow.depositor,
                &to_depositor,
            );
        }

        // Revoked flow is updated so that principal = vested and vesting_period = elapsed
        let now = env.ledger().timestamp();
        let elapsed = now.saturating_sub(flow.commencement);
        let mut updated_flow = flow.clone();
        updated_flow.principal = vested;
        updated_flow.vesting_period = elapsed.max(1);
        updated_flow.claimed_amount = vested;
        env.storage().persistent().set(&flow_id, &updated_flow);

        env.events().publish(
            (
                Symbol::new(&env, "flow_revoked"),
                flow_id,
                flow.depositor.clone(),
            ),
            to_depositor,
        );
    }

    pub fn fetch_user_flows(env: Env, address: Address) -> Vec<u64> {
        let depositor_flows: Vec<u64> = env
            .storage()
            .persistent()
            .get(&(Symbol::new(&env, "depositor_flows"), address.clone()))
            .unwrap_or(Vec::new(&env));
        let beneficiary_flows: Vec<u64> = env
            .storage()
            .persistent()
            .get(&(Symbol::new(&env, "beneficiary_flows"), address.clone()))
            .unwrap_or(Vec::new(&env));

        let mut result = Vec::new(&env);
        for id in depositor_flows.iter() {
            result.push_back(id);
        }
        for id in beneficiary_flows.iter() {
            let mut duplicate = false;
            for r_id in result.iter() {
                if r_id == id {
                    duplicate = true;
                    break;
                }
            }
            if !duplicate {
                result.push_back(id);
            }
        }
        result
    }
}

mod test;
