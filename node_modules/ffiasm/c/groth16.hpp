

template <typename Engine>
#include <string>

class Groth16 {

public:
    class Proof {

    public:
        Engine::G1 A;
        Engine::G2 B;
        Engine::G1 C;
    };

    Engine &E;

    Groth16(Engine &aEngine, std::string &zkeyFileName);
    Proof &prove(Engine::Fr *witness);

};

#include "groth16.cpp"