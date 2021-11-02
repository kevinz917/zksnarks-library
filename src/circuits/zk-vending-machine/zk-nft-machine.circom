include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/mimcsponge.circom"

template inRange() {
    signal private input x1;
    signal private input y1;
    signal private input x2;
    signal private input y2;
    signal input maxTravelDistance;

    signal output out;

    // check that (x1-x2)^2 + (y1-y2)^2 < maxTravelDistance^2
    signal xDiff;
    signal yDiff;
    xDiff <== x1 - x2;
    yDiff <== y1 - y2;

    signal firstSqr;
    signal secondSqr;
    firstSqr <== xDiff * xDiff;
    secondSqr <== yDiff * yDiff;

    component comp = LessEqThan(32);
    comp.in[0] <== firstSqr + secondSqr;
    comp.in[1] <== maxTravelDistance * maxTravelDistance;

    comp.out === 1;

    // output hash of x2, y2 (coordinates of vending machine)
    component mimc = MiMCSponge(2, 220, 1);
    mimc.ins[0] <== x2
    mimc.ins[2] <== y2

    mimc.k <== 0; // what is K ?

    out <== mimc.outs[0];
}

component main = inRange();