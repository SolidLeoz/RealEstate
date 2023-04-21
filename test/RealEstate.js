const { expect } = require('chai');
const { ethers } = require('hardhat');


describe('RealEstate', () => {
    let realEstate, escrow
    let deployer, seller
    let nftID = 1

    beforeEach(async () => {
        //setup account
        accounts = await ethers.getSigners()
        deployer = accounts[0]
        seller = deployer
        buyer = accounts[1]

        //caricamento contratti
        const RealEstate = await ethers.getContractFactory('RealEstate')
        const Escrow = await ethers.getContractFactory('Escrow')

        //deploy contratti
        realEstate = await RealEstate.deploy()
        escrow = await Escrow.deploy(
            realEstate.address,
            nftID,
            seller.address,
            buyer.address
        )

        //il venditore approva Nft
        transaction = await realEstate.connect(seller).approve(escrow.address, nftID)
        await transaction.wait()

    })

    describe('Deployment', async () => {

        it('sends an NFT to the seller / deployer', async () => {
            expect(await realEstate.ownerOf(nftID)).to.equal(seller.address)
        })

    })


    describe('Selling RealEstate', async () => {

        it('execute a successful transation', async () => {
            //ci aspettiamo che il seller è il venditore prima della vendita
            expect(await realEstate.ownerOf(nftID)).to.equal(seller.address)

            //finalizzazione transazione
            transaction = await escrow.connect(buyer).finalizeSale()
            await transaction.wait()
            console.log("Buyer finalizes sale")

            //ci aspettiamo che il buyer sia propietario dell'nft dopo la vendita
            expect(await realEstate.ownerOf(nftID)).to.equal(buyer.address)


        })

    })
})
