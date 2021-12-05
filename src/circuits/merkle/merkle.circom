include "../node_modules/circomlib/circuits/mimcsponge.circom"
include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/gates.circom"

// note: copy of Tornado Cash circuits
// https://github.dev/tornadocash/tornado-core/tree/master/circuits

template MiMCHash(){
  signal input left;
  signal input right;
  signal output hash;

  component hashFunc = MiMCSponge(2, 220, 1);
  hashFunc.ins[0] <== left;
  hashFunc.ins[1] <== right;
  hashFunc.k <== 0;
  hash <== hashFunc.outs[0];
}

// if s == 0 returns [in[0], in[1]]
// if s == 1 returns [in[1], in[0]]
template Sort() {
    signal input ins[2];
    signal input s;
    signal output out[2];

    s * (1 - s) === 0
    out[0] <== (ins[1] - ins[0])*s + ins[0];
    out[1] <== (ins[0] - ins[1])*s + ins[1];
}

template MerkleTreeVerifier(DEPTH) {
  signal input root; 
  signal input leaf;
  signal input merkleElements[DEPTH]; // ["1"]
  signal input merklePath[DEPTH]; // ["1"] (meaning right hand side)

  component selectors[DEPTH];
  component mimcHashs[DEPTH];

  // initiate MiMC circuit
  for(var i=0; i<DEPTH; i++){
    // MUX selectors to sort 2 elements based on merklePath ordering
    selectors[i] = Sort();
    selectors[i].ins[0] <== i == 0? leaf : mimcHashs[i-1].hash;
    selectors[i].ins[1] <== merkleElements[i];
    selectors[i].s <== merklePath[i];

    // MiMC hash
    mimcHashs[i] <== MiMCHash();
    mimcHashs[i].left <== selectors[i].out[0];
    mimcHashs[i].right <== selectors[i].out[1];
  }

  root === mimcHashs[DEPTH-1].hash;
}

component main = MerkleTreeVerifier(2);