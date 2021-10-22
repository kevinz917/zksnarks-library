# zkBattleship

This is an an implementation of the game Battleship using zk-SNARKs. We use Circom to construct the ZK circuits and snarkJS to export it into a solidity verifier.

## Introduction

Traditionally, a game of battleship between two requires peer to peer trust. For instance, when player A names a coordinate on player B's board and attacks, he must trust that player B's response on whether that coordinate was a hit or not is genuine, and that they didn't shift the board layout. In zkBattleship, trust is guaranteed through zkSNARKs. Player A can now trust that player B is telling the truth by verifying the zero knowledge proof.

## Why do we need ZK

Given the nature of the blockchain, all data is public. This would render the game unplayable as two players would know the exact location of their ships by querying the smart contract. Therefore, the map which contains the location of the ships are kept in private locally (ex: in browser cache). When the game starts, opposing players first construct their map and commit the hash of that map to the smart contract, making it unchangeable. The zero knowledge proof therefore allows to verify the truthfulness of a player's response, in tandem with this hashed map value.

## Proof construction

Here I've constructed an example circuit that demonstrates proof of concept. The circuit is to be used by the verifier and is structured in this way

Circuit parameters

```
Public Inputs

hit:             Boolean value of whether the user has been hit or not
publicGuess      2D array of 0s with the guess of the hit location marked by 1
```

```
Private Inputs

privateSolution  2D array of player's map, with ships marked with 1s
out              A MiMC hash of the player map.
```

The verifier (one being attacked in the current round) uses the ZK proof to prove to the other user that what they've said about the "hit" value of their guess is truthful.

The proof does two things

1. It verifies that the "hit" reported by a user is a truthful value. This means that if player A got hit by player B, they won't be able to lie about it
2. The hash of the map verifies in tandem with the initial map hash stored on the smart contract that in between rounds, players didn't alter their map

More instructions coming soon!
