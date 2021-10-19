include "../../node_modules/circomlib/circuits/comparators.circom";
include "../../node_modules/circomlib/circuits/mimcsponge.circom";

template Main() {
    signal private input x;
    signal private input y;
    signal input HASHKEY;

    signal output pub;

    // proof of hash
    component h1 = MiMCSponge(2, 220, 1);
    h1.in[0] <== x;
    h1.in[1] <== y;
    h1.k <== HASHKEY;

    pub <== h1.outs[0];
}