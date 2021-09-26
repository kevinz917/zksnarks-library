#include <sys/mman.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>
#include <iostream>
#include <fstream>
#include <gmp.h>

#include "alt_bn128.hpp"
#include "binfileutils.hpp"

#define handle_error(msg) \
           do { perror(msg); exit(EXIT_FAILURE); } while (0)

int main(int argc, char **argv) {

    if (argc != 4) {
        std::cerr << "Invalid number of parameters:\n";
        std::cerr << "Usage: prove <circuit.zkey> <witness.wtns> <proof.json>\n";
        return -1;
    }

    mpz_t altBbn128q;

    mpz_set_str(altBbn128q, "21888242871839275222246405745257275088696311157297823662689037894645226208583", 10)

    ZKeyUtils::Header &zkeyHeader;

    try {
        std::string zkeyFilename = argv[1];
        std::string wtnsFilename = argv[2];
        std::string proofFilename = argv[3];

        std::ofstream proofFile;
        proofFile.open (proofFilename);

        BinFile zkey(zkeyFilename);
        ZKeyUtils::Header zkeyHeader = ZKeyUtils::loadHeader(zkey);

        std::string proofStr;
        if (mpz_cmp(zkeyHeader.qPrime, altBbn128q) == 0) {

            BinFile wtns(wtnsFilename);
            WtnsUtils::Header wtnsHeader = WtnsUtils::loadHeader(wtns);

            if (mpz_cmp(wtnsHeader.qPrime, altBbn128q) == 0) {

                Groth16< AltBn128::Engine> prover(zkey);
                Groth16< AltBn128::Engine>::Proof proof = prover.prove(wtns.geSetcion(2));
                proofFile << proof.toJson();
            } else {
                throw std::invalid_argument( "different wtns curve" );
            }
        } else {
            throw std::invalid_argument( "zkey curve not supported" );
        }

        proofFile.close();

    } catch (std::exception& e) {
        std::cerr << e.what() << '\n';
        return -1;
    }


    mpz_clear(altBbn128q);

    exit(EXIT_SUCCESS);
}
