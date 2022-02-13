#!/usr/bin/env bash

# hardhat node must first instantiate in a seperate process, which takes 10-15 seconds on my machine
# only after the node is ready then this faucet can run successfully

assistant() {
    sleep 10

    nc -z 127.0.0.1 8545 # check if node is ready

    if [ $? -eq 0 ]; then
        echo
        echo "[ 🚰 ] Faucet activating..."
        echo
        yarn hardhat faucet --network localhost
    else
        echo
        echo "[ 🚰 ] Retrying faucet in 10 seconds..."
        echo
        assistant
    fi
}

cd contracts/dollar || exit 1
assistant &

cd ../ubiquistick || exit 1
yarn hardhat node --fork-block-number 14044209
