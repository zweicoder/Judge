module.exports = function(deployer) {
    deployer.deploy(CheapArrayLib);
    deployer.autolink();
    deployer.deploy(Judge);
};
