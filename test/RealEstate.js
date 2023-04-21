const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

const ether = tokens

describe('RealEstate', () => {
    let realEstate, escrow
    let deployer, seller
    let nftID = 1
    let purchasePrice = ether(100)
    let escrowAmount = ether(20)

    beforeEach(async () => {
        //setup account
        accounts = await ethers.getSigners()
        deployer = accounts[0]
        seller = deployer
        buyer = accounts[1]
        inspector = accounts[2]
        lender = accounts[3]

        //caricamento contratti
        const RealEstate = await ethers.getContractFactory('RealEstate')
        const Escrow = await ethers.getContractFactory('Escrow')

        //deploy contratti
        realEstate = await RealEstate.deploy()
        escrow = await Escrow.deploy(
            realEstate.address,
            nftID,
            purchasePrice,
            escrowAmount,
            seller.address,
            buyer.address,
            inspector.address,
            lender.address
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
        let balance, transaction

        it('execute a successful transation', async () => {
            //ci aspettiamo che il seller è il venditore prima della vendita
            expect(await realEstate.ownerOf(nftID)).to.equal(seller.address)

            //controllo escrow balance
            balance = await escrow.getBalance()
            console.log("escrow balance:", ethers.utils.formatEther(balance))

            //Deposito 
            transaction = await escrow.connect(buyer).depositEarnest({ value: escrowAmount })
            console.log("buyer has deposit earnest money")

            //controllo escrow balance
            balance = await escrow.getBalance()
            console.log("escrow balance:", ethers.utils.formatEther(balance))

            //ispezione sull'immobile per il prestito
            transaction = await escrow.connect(inspector).updateInspectionStatus(true)
            await transaction.wait()
            console.log("Inspector updates status")

            //approvazione transazione buyer
            transaction = await escrow.connect(buyer).approveSale()
            await transaction.wait()
            console.log("Buyer approves sale")

            //approvazione transazione seller
            transaction = await escrow.connect(seller).approveSale()
            await transaction.wait()
            console.log("seller approves sale")

            //fondi finanziamento
            transaction = await lender.sendTransaction({ to: escrow.address, value: ether(80) })

            //approvazione transazione lender
            transaction = await escrow.connect(lender).approveSale()
            await transaction.wait()
            console.log("lender approves sale")


            //finalizzazione transazione
            transaction = await escrow.connect(buyer).finalizeSale()
            await transaction.wait()
            console.log("Buyer finalizes sale")

            //ci aspettiamo che il buyer sia propietario dell'nft dopo la vendita
            expect(await realEstate.ownerOf(nftID)).to.equal(buyer.address)

            //ci asepttiamo che il venditore abbia i fondi
            balance = await ethers.provider.getBalance(seller.address)
            console.log("seller balance:", ethers.utils.formatEther(balance))
            expect(balance).to.be.above(ether(10099))

        })

    })
})
