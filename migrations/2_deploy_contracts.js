module.exports = function(deployer) {

    deployer.deploy(CheapArrayLib);
    deployer.autolink();
    if (process.env.NODE_ENV == 'test'){
        deployer.deploy(CheapArrayLibTest)
    }
    deployer.deploy(Judge);
};
