#include <iostream>

#include "splitparstr.hpp"

int main(int argc, char **argv) {

    auto v = splitParStr(argv[1]);

    for (std::vector<std::string>::const_iterator i = v.begin(); i != v.end(); ++i)
        std::cout << *i << std::endl;
}
