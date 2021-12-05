include "../node_modules/circomlib/circuits/mimcsponge.circom"
include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/gates.circom"

/*
  Inputs:
  - hashes (pub) List of all user hashes
  - msg (pub)
  - secret

  Intermediate values:
  - x (supposed to be hash of secret)
  
  Output:
  - msgAttestation
  
  Prove:
  - mimc(secret) == x
  - (x - hash1)(x - hash2)(x - hash3)... == 0. Basically a big loop for ORs.
  - msgAttestation == mimc(msg, secret)
*/

template Main(GROUP_SIZE) {
  signal private input secret;
  signal input hashes[GROUP_SIZE];
  signal input msg;

  signal userPub;

  signal output msgAttestation;

  // MiMC hash of secret
  component mimcSecret = MiMCSponge(1, 220, 1);
  mimcSecret.ins[0] <== secret;
  mimcSecret.k <== 0;
  userPub <== mimcSecret.outs[0];

  component eqs[GROUP_SIZE];
  component is_hash_present[GROUP_SIZE];

  for(var i=0; i<GROUP_SIZE; i++){
    eqs[i] = IsEqual();
    eqs[i].in[0] <== userPub;
    eqs[i].in[1] <== hashes[i];

    is_hash_present[i] = OR();
  }

  // a big loop of ORs
  for(var i=1; i<GROUP_SIZE; i++){
    is_hash_present[i].a <== eqs[i].out;
    is_hash_present[i].b <== i == 1 ? eqs[0].out : is_hash_present[i-1].out;
  }

  // assert that hash is present
  is_hash_present[GROUP_SIZE-1].out === 1;
  
  // sign and return output message using user's secret
  component mimcAttestation = MiMCSponge(2, 220, 1);
  mimcAttestation.ins[0] <== msg;
  mimcAttestation.ins[1] <== secret;
  mimcAttestation.k <== 0;
  msgAttestation <== mimcAttestation.outs[0];
}

//////
// Inputs:
//  - hash (pub)
//  - msgAttestation (pub)
//  - msg (pub)
//  - secret
 
// Outputs:
//  - msgAttestation
 
// Prove:
//  - msgAttestation == mimc(msg, secret)
//  - hash = mimc(secret)


template RevealSigner(N) {
    signal input hash;
    signal input msg;
    signal input msgAttestation;
    signal private input secret;

    // hash = mimc(secret)
    component mimcHash = MiMCSponge(1, 220, 1);
    mimcHash.ins[0] <== secret;
    mimcHash.k <== 0;
    hash === mimcHash.outs[0];

    // msgAttestation !== mimc(msg, secret)
    component mimcAttestation = MiMCSponge(2, 220, 1);
    mimcAttestation.ins[0] <== msg;
    mimcAttestation.ins[1] <== secret;
    mimcAttestation.k <== 0;

    msgAttestation === mimcAttestation.outs[0];
}


// denySignature

// Inputs:
//  - hash (pub)
//  - msg (pub)
//  - secret

// Outputs:
//  - msgAttestation 

// Prove
//  - msgAttestation != mimc(msg, secret)
//  - hash = mimc(secret)

template DenySignature() {
    signal input hash;
    signal input msgAttestation;
    signal input msg;
    signal private input secret;

    // hash = mimc(secret)
    component mimcHash = MiMCSponge(1, 220, 1);
    mimcHash.ins[0] <== secret;
    mimcHash.k <== 0;
    hash === mimcHash.outs[0];

     // msgAttestation == mimc(msg, secret)
    component mimcAttestation = MiMCSponge(2, 220, 1);
    mimcAttestation.ins[0] <== msg;
    mimcAttestation.ins[1] <== secret;
    mimcAttestation.k <== 0;
  
    component areMessagesEql = IsEqual();
    areMessagesEql.in[0] <== msgAttestation;
    areMessagesEql.in[1] <== mimcAttestation.outs[0];

    areMessagesEql.out === 0;
}

component main = Main(40);