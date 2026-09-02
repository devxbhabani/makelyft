#include <emscripten/emscripten.h>

extern "C"{
    EMSCRIPTEN_KEEPALIVE
    unsigned long long modulation(unsigned long long base, unsigned long long exponent, unsigned long long modulous){
        if (modulous == 1) return 0;

        unsigned long long result = 1;

        while(exponent > 0){
            if(exponent & 1){
                result = (result * base) % modulous;
            }

            base = (base * base) % modulous;
            exponent = exponent >> 1;
        }

        return result;
    }
}
