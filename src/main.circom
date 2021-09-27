include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/gates.circom";

// searches whether a grid can be traversed from point A to point B
// applications: prove that a player has traversed from point 1 to point b without revealing location
// TODO: Copy code from main.circom to here
// TODO: Figure out better compilation workflow

template BFS() {
   signal private input cards[5]; // Each 2..14
   signal input hasDouble; // 1 or 0
   signal output out; // 1 or 0

   // intermediate results
   signal isTrue;

   // Count pairs
   var numPairs = 0;
   for (var i=0; i<4; i++) {
    for (var j=i+1; j<5; j++) {
      if (cards[i] == cards[j]) {
        numPairs++;
      }
    }
   }

   isTrue <-- (hasDouble == 1);

   var hasPairs = (numPairs > 0);

   log(isTrue);
   log(hasPairs);

   component or2 = AND();
   or2.a <-- hasPairs;
   or2.b <-- isTrue;
   or2.out === 1;

   out <-- or2.out;
   out === 1;
}

component main = BFS();