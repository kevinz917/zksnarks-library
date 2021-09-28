include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/gates.circom";

template ArraySum() {
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

component main = ArraySum();