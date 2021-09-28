include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/gates.circom";

// searches whether a grid can be traversed from point A to point B
// applications: prove that a player has traversed from point 1 to point b without revealing location
// TODO: Copy code from main.circom to here
// TODO: Figure out better compilation workflow

template BFS() {
   signal private input cards[5]; // Each 2..14
   signal input number; // 1 or 0
   signal output out; // 1 or 0

   signal sum; // signals are immutable

   for(var i=0; i<5; i++){
     sum <-- sum + cards[i]
   }

   log(sum)

   component eq = IsEqual();
   eq.in[0] <-- sum;
   eq.in[1] <-- number;

   out <-- eq.out;
   out === 1;
}

component main = BFS();