module.exports = function(deployer) {

    deployer.deploy(CheapArrayLib);
    // deployer.deploy(JudgeSubscriber);
    deployer.autolink();
    if (process.env.NODE_ENV == 'test'){
        deployer.deploy(CheapArrayLibTest)
        deployer.deploy(JudgeSubImpl)
    }
    deployer.deploy(Judge);
};
