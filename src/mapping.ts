import { BigInt } from "@graphprotocol/graph-ts"
import {
  AquaFiPrimary,
  AccessControlRevoked,
  ControllerContractUpdated,
  FeeReceiverUpdated,
  FeeUpdated,
  HandlerUpdated,
  OracleAddressUpdated,
  PremiumContractUpdated,
  RoleAdminChanged,
  RoleGranted,
  RoleRevoked,
  Staked,
  Unstaked
} from "../generated/AquaFiPrimary/AquaFiPrimary"
import { ExampleEntity } from "../generated/schema"

export function handleAccessControlRevoked(event: AccessControlRevoked): void {
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type
  let entity = ExampleEntity.load(event.transaction.from.toHex())

  // Entities only exist after they have been saved to the store;
  // `null` checks allow to create entities on demand
  if (!entity) {
    entity = new ExampleEntity(event.transaction.from.toHex())

    // Entity fields can be set using simple assignments
    entity.count = BigInt.fromI32(0)
  }

  // BigInt and BigDecimal math are supported
  entity.count = entity.count + BigInt.fromI32(1)

  // Entity fields can be set based on event parameters
  entity.methodId = event.params.methodId

  // Entities can be written to the store with `.save()`
  entity.save()

  // Note: If a handler doesn't require existing field values, it is faster
  // _not_ to load the entity from the store. Instead, create it fresh with
  // `new Entity(...)`, set the fields that should be updated and save the
  // entity back to the store. Fields that were not set or unset remain
  // unchanged, allowing for partial updates to be applied.

  // It is also possible to access smart contracts from mappings. For
  // example, the contract that has emitted the event can be connected to
  // with:
  //
  // let contract = Contract.bind(event.address)
  //
  // The following functions can then be called on this contract to access
  // state variables and other data:
  //
  // - contract.CONTRACT_CONTROLLER(...)
  // - contract.DEFAULT_ADMIN_ROLE(...)
  // - contract.MAX_PROTOCL_FEE(...)
  // - contract.WETH(...)
  // - contract.aquaPremiumContract(...)
  // - contract.aquaToken(...)
  // - contract.fee(...)
  // - contract.feeReceiver(...)
  // - contract.getRoleAdmin(...)
  // - contract.handlerToContract(...)
  // - contract.hasRole(...)
  // - contract.isAccessControlDisabled(...)
  // - contract.oracleContract(...)
  // - contract.stakes(...)
  // - contract.supportsInterface(...)
}

export function handleControllerContractUpdated(
  event: ControllerContractUpdated
): void {}

export function handleFeeReceiverUpdated(event: FeeReceiverUpdated): void {}

export function handleFeeUpdated(event: FeeUpdated): void {}

export function handleHandlerUpdated(event: HandlerUpdated): void {}

export function handleOracleAddressUpdated(event: OracleAddressUpdated): void {}

export function handlePremiumContractUpdated(
  event: PremiumContractUpdated
): void {}

export function handleRoleAdminChanged(event: RoleAdminChanged): void {}

export function handleRoleGranted(event: RoleGranted): void {}

export function handleRoleRevoked(event: RoleRevoked): void {}

export function handleStaked(event: Staked): void {}

export function handleUnstaked(event: Unstaked): void {}
