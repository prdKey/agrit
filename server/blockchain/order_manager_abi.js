export const ORDER_MANAGER_ABI = [
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "orderId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "logisticsAddress",
				"type": "address"
			}
		],
		"name": "acceptOrder",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "orderId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "buyerAddress",
				"type": "address"
			}
		],
		"name": "cancelOrderByBuyer",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_agtToken",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "_productManager",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [],
		"name": "AutoReleaseNotYet",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "orderId",
				"type": "uint256"
			}
		],
		"name": "autoReleasePayment",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "BatchSellerMismatch",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "orderId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "sellerAddress",
				"type": "address"
			}
		],
		"name": "cancelOrderBySeller",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "CannotCancelOrder",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "orderId",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "location",
				"type": "string"
			},
			{
				"internalType": "address",
				"name": "logisticsAddress",
				"type": "address"
			}
		],
		"name": "confirmDeliveryByLogistics",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "orderId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "buyerAddress",
				"type": "address"
			}
		],
		"name": "confirmReceipt",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "orderId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "sellerAddress",
				"type": "address"
			}
		],
		"name": "confirmShipment",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "EmptyOrder",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InactiveProduct",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InsufficientStock",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InvalidOrderState",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InvalidQuantity",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InvalidVariant",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "orderId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "logisticsAddress",
				"type": "address"
			}
		],
		"name": "markOutForDelivery",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "NotAuthorized",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "NotBuyer",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "NotDisputed",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "NotSeller",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "orderId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "senderAddress",
				"type": "address"
			}
		],
		"name": "openDispute",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "OwnableInvalidOwner",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "OwnableUnauthorizedAccount",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "PaymentFailed",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "orderId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "platformFee",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "logisticsFee",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "sellerAmount",
				"type": "uint256"
			}
		],
		"name": "FeesDistributed",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "orderId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "location",
				"type": "string"
			}
		],
		"name": "LocationUpdated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "orderId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "logistics",
				"type": "address"
			}
		],
		"name": "OrderAssignedToLogistics",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "orderId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			}
		],
		"name": "OrderAutoReleased",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "orderId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "refundAmount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "cancellationFee",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			}
		],
		"name": "OrderCancelledByBuyer",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "orderId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			}
		],
		"name": "OrderCancelledBySeller",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "orderId",
				"type": "uint256"
			}
		],
		"name": "OrderCompleted",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "orderId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "buyer",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "seller",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "totalProductPrice",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "totalPrice",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "itemCount",
				"type": "uint256"
			}
		],
		"name": "OrderCreated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "orderId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "location",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			}
		],
		"name": "OrderDelivered",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "orderId",
				"type": "uint256"
			}
		],
		"name": "OrderDisputed",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "orderId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			}
		],
		"name": "OrderOutForDelivery",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "orderId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "logistics",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "location",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			}
		],
		"name": "OrderPickedUp",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "orderId",
				"type": "uint256"
			}
		],
		"name": "OrderRefunded",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "orderId",
				"type": "uint256"
			}
		],
		"name": "OrderShipped",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "previousOwner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "OwnershipTransferred",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "orderId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "logisticsAddress",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "location",
				"type": "string"
			}
		],
		"name": "pickupOrder",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "productId",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "quantity",
						"type": "uint256"
					},
					{
						"internalType": "bool",
						"name": "hasVariant",
						"type": "bool"
					},
					{
						"internalType": "uint256",
						"name": "variantIndex",
						"type": "uint256"
					}
				],
				"internalType": "struct OrderManager.OrderItem[]",
				"name": "items",
				"type": "tuple[]"
			},
			{
				"internalType": "address",
				"name": "buyerAddress",
				"type": "address"
			}
		],
		"name": "placeOrder",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "orderId",
				"type": "uint256"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "renounceOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "orderId",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "refundBuyer",
				"type": "bool"
			}
		],
		"name": "resolveDispute",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "r",
				"type": "uint256"
			}
		],
		"name": "setCancellationFeeRate",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "f",
				"type": "uint256"
			}
		],
		"name": "setFixedLogisticsFee",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "r",
				"type": "uint256"
			}
		],
		"name": "setPlatformFeeRate",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "transferOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "orderId",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "location",
				"type": "string"
			},
			{
				"internalType": "address",
				"name": "logisticsAddress",
				"type": "address"
			}
		],
		"name": "updateLocation",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "agtToken",
		"outputs": [
			{
				"internalType": "contract AGTToken",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "AUTO_RELEASE_PERIOD",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "buyerOrders",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "productPrice",
				"type": "uint256"
			}
		],
		"name": "calculateTotalPrice",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "totalPrice",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "platformFee",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "logisticsFee",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "orderId",
				"type": "uint256"
			}
		],
		"name": "canBuyerCancelOrder",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			},
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "cancellationFeeRate",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "orderId",
				"type": "uint256"
			}
		],
		"name": "canSellerCancelOrder",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			},
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "FEE_DENOMINATOR",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "fixedLogisticsFee",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getAllOrders",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "id",
						"type": "uint256"
					},
					{
						"internalType": "address",
						"name": "buyerAddress",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "sellerAddress",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "logisticsAddress",
						"type": "address"
					},
					{
						"internalType": "enum OrderManager.OrderStatus",
						"name": "status",
						"type": "uint8"
					},
					{
						"internalType": "string",
						"name": "location",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "totalProductPrice",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "totalPrice",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "platformFee",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "logisticsFee",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "createdAt",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "confirmAt",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "pickedUpAt",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "outForDeliveryAt",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "deliveredAt",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "completedAt",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "cancelledAt",
						"type": "uint256"
					}
				],
				"internalType": "struct OrderManager.Order[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "orderId",
				"type": "uint256"
			}
		],
		"name": "getAutoReleaseStatus",
		"outputs": [
			{
				"internalType": "bool",
				"name": "eligible",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "secondsLeft",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getAvailableOrders",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "id",
						"type": "uint256"
					},
					{
						"internalType": "address",
						"name": "buyerAddress",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "sellerAddress",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "logisticsAddress",
						"type": "address"
					},
					{
						"internalType": "enum OrderManager.OrderStatus",
						"name": "status",
						"type": "uint8"
					},
					{
						"internalType": "string",
						"name": "location",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "totalProductPrice",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "totalPrice",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "platformFee",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "logisticsFee",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "createdAt",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "confirmAt",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "pickedUpAt",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "outForDeliveryAt",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "deliveredAt",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "completedAt",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "cancelledAt",
						"type": "uint256"
					}
				],
				"internalType": "struct OrderManager.Order[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "orderId",
				"type": "uint256"
			}
		],
		"name": "getOrderById",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "id",
						"type": "uint256"
					},
					{
						"internalType": "address",
						"name": "buyerAddress",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "sellerAddress",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "logisticsAddress",
						"type": "address"
					},
					{
						"internalType": "enum OrderManager.OrderStatus",
						"name": "status",
						"type": "uint8"
					},
					{
						"internalType": "string",
						"name": "location",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "totalProductPrice",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "totalPrice",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "platformFee",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "logisticsFee",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "createdAt",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "confirmAt",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "pickedUpAt",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "outForDeliveryAt",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "deliveredAt",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "completedAt",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "cancelledAt",
						"type": "uint256"
					}
				],
				"internalType": "struct OrderManager.Order",
				"name": "",
				"type": "tuple"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "orderId",
				"type": "uint256"
			}
		],
		"name": "getOrderLineItems",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "productId",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "quantity",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "productPrice",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "pricePerUnit",
						"type": "uint256"
					},
					{
						"internalType": "string",
						"name": "name",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "category",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "imageCID",
						"type": "string"
					},
					{
						"internalType": "bool",
						"name": "hasVariant",
						"type": "bool"
					},
					{
						"internalType": "uint256",
						"name": "variantIndex",
						"type": "uint256"
					},
					{
						"internalType": "string",
						"name": "variantLabel",
						"type": "string"
					}
				],
				"internalType": "struct OrderManager.LineItem[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "buyer",
				"type": "address"
			}
		],
		"name": "getOrdersByBuyer",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "id",
						"type": "uint256"
					},
					{
						"internalType": "address",
						"name": "buyerAddress",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "sellerAddress",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "logisticsAddress",
						"type": "address"
					},
					{
						"internalType": "enum OrderManager.OrderStatus",
						"name": "status",
						"type": "uint8"
					},
					{
						"internalType": "string",
						"name": "location",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "totalProductPrice",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "totalPrice",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "platformFee",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "logisticsFee",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "createdAt",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "confirmAt",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "pickedUpAt",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "outForDeliveryAt",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "deliveredAt",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "completedAt",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "cancelledAt",
						"type": "uint256"
					}
				],
				"internalType": "struct OrderManager.Order[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "logistics",
				"type": "address"
			}
		],
		"name": "getOrdersByLogistics",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "id",
						"type": "uint256"
					},
					{
						"internalType": "address",
						"name": "buyerAddress",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "sellerAddress",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "logisticsAddress",
						"type": "address"
					},
					{
						"internalType": "enum OrderManager.OrderStatus",
						"name": "status",
						"type": "uint8"
					},
					{
						"internalType": "string",
						"name": "location",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "totalProductPrice",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "totalPrice",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "platformFee",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "logisticsFee",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "createdAt",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "confirmAt",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "pickedUpAt",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "outForDeliveryAt",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "deliveredAt",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "completedAt",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "cancelledAt",
						"type": "uint256"
					}
				],
				"internalType": "struct OrderManager.Order[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "seller",
				"type": "address"
			}
		],
		"name": "getOrdersBySeller",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "id",
						"type": "uint256"
					},
					{
						"internalType": "address",
						"name": "buyerAddress",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "sellerAddress",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "logisticsAddress",
						"type": "address"
					},
					{
						"internalType": "enum OrderManager.OrderStatus",
						"name": "status",
						"type": "uint8"
					},
					{
						"internalType": "string",
						"name": "location",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "totalProductPrice",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "totalPrice",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "platformFee",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "logisticsFee",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "createdAt",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "confirmAt",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "pickedUpAt",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "outForDeliveryAt",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "deliveredAt",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "completedAt",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "cancelledAt",
						"type": "uint256"
					}
				],
				"internalType": "struct OrderManager.Order[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getPlatformEarnings",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getTotalCancellationFees",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getTotalLogisticsFees",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "orderCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "orderLineItems",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "productId",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "quantity",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "productPrice",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "pricePerUnit",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "name",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "category",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "imageCID",
				"type": "string"
			},
			{
				"internalType": "bool",
				"name": "hasVariant",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "variantIndex",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "variantLabel",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "orders",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "buyerAddress",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "sellerAddress",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "logisticsAddress",
				"type": "address"
			},
			{
				"internalType": "enum OrderManager.OrderStatus",
				"name": "status",
				"type": "uint8"
			},
			{
				"internalType": "string",
				"name": "location",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "totalProductPrice",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "totalPrice",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "platformFee",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "logisticsFee",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "createdAt",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "confirmAt",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "pickedUpAt",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "outForDeliveryAt",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "deliveredAt",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "completedAt",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "cancelledAt",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "platformFeeRate",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "productManager",
		"outputs": [
			{
				"internalType": "contract ProductManager",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "sellerOrders",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "totalCancellationFees",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "totalLogisticsFees",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "totalPlatformFees",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]