include "../../node_modules/circomlib/circuits/comparators.circom";

template InArea() {
    signal input longitude[2]; // (longitude, latitude)
    signal input latitude[2];
    signal private input location[2];
    signal output out;

    // min longitude check
    component gt1 = GreaterEqThan(9);
    gt1.in[0] <== location[0];
    gt1.in[1] <== longitude[0];
    gt1.out === 1;
    out <-- gt1.out; // what does <-- mean?

    // max longitude check
    component gt2 = LessEqThan(9);
    gt2.in[0] <== location[0];
    gt2.in[1] <== longitude[1];
    gt2.out === 1; // bool?

    // min latitude check
    component lt1 = GreaterEqThan(9);
    lt1.in[0] <== location[1];
    lt1.in[1] <== latitude[0];
    lt1.out === 1;

    // max longitude check
    component lt2 = LessEqThan(9);
    lt2.in[0] <== location[1];
    lt2.in[1] <== latitude[1];
    lt2.out === 1;

    out <-- (gt1.out + gt2.out + lt1.out + lt2.out) / 4; // is this actually needed?
    out === 1;
}

component main = InArea();
