#!/bin/bash

function buildCircuit() {
    echo "Building circuit" &&
        circom main.circom --r1cs --wasm --sym &&
        snarkjs zkey new main.r1cs ./powerOfTau/powersOfTau28_hez_final_15.ptau circuit_0000.zkey &&
        snarkjs zkey contribute circuit_0000.zkey circuit_final.zkey &&
        snarkjs zkey export verificationkey circuit_final.zkey verification_key.json &&
        snarkjs wtns calculate main.wasm input.json witness.wtns &&
        snarkjs groth16 prove circuit_final.zkey witness.wtns proof.json public.json &&
        snarkjs groth16 verify verification_key.json public.json proof.json &&
        snarkjs zkey export solidityverifier circuit_final.zkey verifier.sol &&
        snarkjs generatecall >contractInput.js &&
        cleanUp &&
        echo "Finished compiling circuit!"

}

function cleanUp() {
    echo "Clearing files"
    rm main.r1cs
    rm main.wasm
    rm verification_key.json
    rm main.sym
    rm witness.wtns
    rm circuit_0000.zkey
    rm circuit_final.zkey
    rm proof.json
    echo "Finished cleaning files!"
    date

}

no_args="true"
while getopts ":c" opt; do
    case $opt in
    c)
        cleanUp
        ;;

    esac
    no_args="false"
done

[[ "$no_args" == "true" ]] && {
    buildCircuit
    exit 1
}
