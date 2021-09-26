



template <typename Engine>
Groth16<Engine>::Groth16(Engine &aEngine, std::string &zkey) {
    E = aEngine;
}

template <typename Engine>
Proof Groth16<Engine>::prove(std::string &zkey) {

    Proof p;
    E.G1.copy(p.A, E.G1.one());
    E.G2.copy(p.B, E.G2.one());
    E.G1.copy(p.A, E.G1.one());

    return p;
}