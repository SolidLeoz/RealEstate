// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

interface IERC721 {
    function transferFrom(address _from, address _to, uint256 _id) external;
}

contract Escrow {
    address public nftAddress;
    uint256 public nftID;
    uint256 public purchasePrice;
    uint256 public escrowAmount;
    address payable public seller;
    address payable public buyer;
    address public inspector;
    address public lender;

    modifier onlyBuyer() {
        require(msg.sender == buyer, "Only buyer can call this function");
        _;
    }

    modifier onlyInspector() {
        require(
            msg.sender == inspector,
            "Only inspector  can call this function"
        );
        _;
    }

    bool public inspectionPassed = false;
    mapping(address => bool) public approval;

    receive() external payable {}

    constructor(
        address _nftAddress,
        uint256 _nftID,
        uint256 _purchasePrice,
        uint256 _escrowAmount,
        address payable _seller,
        address payable _buyer,
        address _inspector,
        address _lender
    ) {
        nftAddress = _nftAddress;
        nftID = _nftID;
        purchasePrice = _purchasePrice;
        escrowAmount = _escrowAmount;
        seller = _seller;
        buyer = _buyer;
        inspector = _inspector;
        lender = _lender;
    }

    function depositEarnest() public payable onlyBuyer {
        require(msg.value >= escrowAmount);
    }

    function updateInspectionStatus(bool _passed) public onlyInspector {
        inspectionPassed = _passed;
    }

    function approveSale() public {
        approval[msg.sender] = true;
    }

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }

    function finalizeSale() public {
        require(inspectionPassed, "must pass inspection");
        require(approval[buyer], "must be approved by buyer ");
        require(approval[seller], "must be approved by seller ");
        require(approval[lender], "must be approved by lender ");
        require(
            address(this).balance >= purchasePrice,
            "must have enourh eth for sale"
        );
        //verifica presenza fondi
        (bool success, ) = payable(seller).call{value: address(this).balance}(
            ""
        );
        require(success);

        //trasferimento di propietà
        IERC721(nftAddress).transferFrom(seller, buyer, nftID);
    }
}
