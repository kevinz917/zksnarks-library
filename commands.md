## Instructions to paste

circom main.circom --r1cs --wasm --sym

snarkjs zkey new main.r1cs powersOfTau28_hez_final_15.ptau circuit_0000.zkey
snarkjs zkey contribute circuit_0000.zkey circuit_final.zkey
snarkjs zkey export verificationkey circuit_final.zkey verification_key.json

snarkjs wtns calculate main.wasm input.json witness.wtns

snarkjs groth16 prove circuit_final.zkey witness.wtns proof.json public.json

snarkjs groth16 verify verification_key.json public.json proof.json

# Download the P of Tau ceremony file (figure out what this actually does)

wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_15.ptau

# To generate the Solidity code

snarkjs zkey export solidityverifier circuit_final.zkey verifier.sol

 <!-- To generate parameters of the call -->

snarkjs generatecall
