const ethers = require('ethers')
window.ethers = ethers
let eth;
if (process.env.REACT_APP_NETWORK === "mainnet") {
    eth = new ethers.providers.InfuraProvider()
} else {
    const network = ethers.providers.getNetwork("goerli");
    eth = new ethers.providers.InfuraProvider(network)
}
export default eth
