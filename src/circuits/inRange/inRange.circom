include "../node_modules/circomlib/circuits/comparators.circom";

template inRange() {
    signal private input x1;
    signal private input y1;
    signal input x2;
    signal input y2;
    signal input r;

    signal output out;

    component comp = LessThan(32);
    signal x1Sq;
    signal y2Sq;
    signal distSum;
    x1Sq <== (x1 - x2) ** 2;
    y2Sq <== (y1 - y2) ** 2;
    distSum <== x1Sq + y2Sq;
    comp.in[0] <== distSum;
    comp.in[1] <== r**2;
    comp.out === 1;

    out <-- comp.out;
    out === 1;
}

component main = inRange();