#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, String, Symbol,
};

#[contracttype]
#[derive(Clone)]
pub enum StorageKey {
    Authority,
    AccountBalance(Address),
}

#[contract]
pub struct FlowTokenContract;

#[contractimpl]
impl FlowTokenContract {
    pub fn name(env: Env) -> String {
        String::from_str(&env, "FlowVault Utility Token")
    }

    pub fn symbol(env: Env) -> String {
        String::from_str(&env, "FVT")
    }

    pub fn decimals(_env: Env) -> u32 {
        7
    }

    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&StorageKey::Authority) {
            panic!("already initialized");
        }
        env.storage().instance().set(&StorageKey::Authority, &admin);
    }

    pub fn admin(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&StorageKey::Authority)
            .expect("admin authority not set")
    }

    pub fn balance(env: Env, id: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&StorageKey::AccountBalance(id))
            .unwrap_or(0)
    }

    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();
        if amount <= 0 {
            panic!("amount must be positive");
        }
        let from_balance = Self::balance(env.clone(), from.clone());
        if from_balance < amount {
            panic!("insufficient balance");
        }

        env.storage().persistent().set(
            &StorageKey::AccountBalance(from.clone()),
            &(from_balance - amount),
        );

        let to_balance = Self::balance(env.clone(), to.clone());
        env.storage().persistent().set(
            &StorageKey::AccountBalance(to.clone()),
            &(to_balance + amount),
        );

        env.events()
            .publish((symbol_short!("transfer"), from, to), amount);
    }

    pub fn mint(env: Env, to: Address, amount: i128) {
        let admin = Self::admin(env.clone());
        admin.require_auth();
        if amount <= 0 {
            panic!("amount must be positive");
        }
        let balance = Self::balance(env.clone(), to.clone());
        env.storage()
            .persistent()
            .set(&StorageKey::AccountBalance(to.clone()), &(balance + amount));

        env.events()
            .publish((Symbol::new(&env, "mint"), to), amount);
    }
}

mod test;
