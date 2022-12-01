const ethers = require('ethers');
window.ethers = ethers;
let web3;
if (process.env.REACT_APP_NETWORK === 'mainnet') {
  web3 = new ethers.providers.InfuraProvider();
} else {
  const network = ethers.providers.getNetwork('goerli');
  web3 = new ethers.providers.InfuraProvider(network);
}
export default web3;
