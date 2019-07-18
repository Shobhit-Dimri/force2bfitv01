'use strict';

const config = require('./config');
const express = require('express');
const bodyParser = require('body-parser');
const sfcc = require('./sfcc-apis.js');
const jwtdecode = require('jwt-decode');
const app = express();
var recommendedName;
var token = '';
var text = '';
var cardId;
var basketId;
var payment_id;
var customer_id;
var username = 'oyvind.svartveit@gmail.com';
var password = '7vL$fhXsjF';
var orderTotal;
var customerName;
var customer_address_id;
var product_id;
var price;
var messageData = '';
var orderCode;
debugger;


if (!config.API_AI_CLIENT_ACCESS_TOKEN) {
	throw new Error('missing API_AI_CLIENT_ACCESS_TOKEN');
}
if (!config.SERVER_URL) { //used for ink to static files
	throw new Error('missing SERVER_URL');
}


app.set('port', (process.env.PORT || 4988))

//serve static files in the public directory
app.use(express.static('public'));

// Process application/json
app.use(bodyParser.json());

const sessionIds = new Map();

// Index route
app.get('/', function (req, res) {
	res.send('Hello world, I am a chat bot')
})

app.post('/webhook/', (req, res) => {

	console.log(req.body.lang);
	var data = req.body;
	var lang = req.body.lang;
	var actionName = req.body.result.action;
	var parameters = req.body.result.parameters;
	var message = req.body.result.resolvedQuery;

	console.log("***** Action Provoked ***** "+actionName);

	switch (actionName) {

		case 'authCheck': {
			console.log("Input welcome");
			if (isDefined(actionName)) {
				sfcc.getAuthTokenService(username, password, (error, result) => {
					if (error) {
						console.log(error);
					} else {
						customer_id = result.customer_id
						token = result.token
						customerName = result.first_name
						sfcc.createCartService(result.token, (error, cartResult) => {
							if (error) {
								console.log(error);
							} else {
								basketId = cartResult.basketId;
							}
						});
						if (lang == 'en-us') {
							console.log("In english");
							text = `Good, I will set that up. Since this is your first PT hour is there anything you would like to focus on, for example exercises specific to cycling?`;
							messageData = {
								speech: text,
								displayText: text
							}
							res.send(messageData);
						} else {
							text = `Flott, da booker jeg det inn. Siden dette blir din første PT-time er det noe du vil fokusere på, for eksempel styrketrening relatert til sykling?`;
							messageData = {
								speech: text,
								displayText: text
							}
							res.send(messageData);
						}
					}
				});
			}
		}
			break;

		case 'checkCosten': {
			console.log('In check cost of product');
			var productName = 'proteindrink';
			if (isDefined(actionName)) {
				sfcc.getProductDetailsService(productName, (error, result) => {
					if (error) {
						console.log(error);
					} else {
						price = result.productPrice;
						product_id = result.productId;
						if (lang == 'en-us' || lang == 'en-in') {
							console.log('Inside english');
							text = `It costs ${price} kroner and we will invoice it through your subscription`;
							messageData = {
								speech: text,
								displayText: text
							}
							res.send(messageData);
						} else {
							console.log('Inside Norway');
							text = `Den koster ${price} kroner og villegge på den månedlige fakturaendin`;
							messageData = {
								speech: text,
								displayText: text
							}
							res.send(messageData);
						}
					}
				});
			}
		}
			break;

		case 'setShipment': {
			console.log("In setShipment");
			if (isDefined(actionName)) {
				sfcc.getAddressService(token, customer_id, (error, addressResult) => {
					if (error) {
						console.log(error);
					} else {
						customer_address_id = addressResult.customer_address_id;
						sfcc.setShipmentService(token, customer_address_id, basketId, (error, result) => {
							if (error) {
								console.log(error);
							} else {
								console.log(result.responseCode);
								if (lang == 'en-us' || lang == 'en-in') {
									text = `Great. Thomas Thomassen will meet you at 17:00 in the reception area and I will let him know that you want to increase your strength in terms on cycling. By the way would you like to purchase a protein shake for after you work out?`;
								} else {
									text = `Glimrende. Thomas Thomassen vil møte deg i resepsjonen klokken 17:00 og jeg gir han beskjed om at du ønsker å fokusere styrketrening relatert til sykling. Forresten, kunne du tenke deg en proteinshake etter treningen?`;
								}
								messageData = {
									speech: text,
									displayText: text
								}
								res.send(messageData);
							}
						});
					}
				});
			}
		}
			break;

		case 'process-order': {
			console.log("In process-order");
			if (isDefined(actionName)) {
				sfcc.addProductsToCart(token, product_id, basketId, (error, result) => {
					if (error) {
						console.log(error);
					} else {
						console.log(result.responseCode);
						console.log('Basket ID----> ', basketId);
						sfcc.setShipmentIdService(token, basketId, (error, result) => {
							if (error) {
								console.log(error);
							} else {
								orderTotal = result.product_total;
								sfcc.addPaymentService(token, basketId, customerName, orderTotal, (error, result) => {
									if (error) {
										console.log(error);
									} else {
										console.log(result.responseCode);
										if (lang == 'en-us' || lang == 'en-in') {
											text = `Perfect, I confirm the order. Any thing else I can do for you?`;
										} else {
											text = `Perfekt, er det noe annet jeg kan gjøre for deg?`;
										}
										messageData = {
											speech: text,
											displayText: text
										}
										res.send(messageData);
									}
								});
							}
						});
					}
				});
			}
		}
			break;

		case 'orderComplete': {
			console.log("In orderComplete");
			if (isDefined(actionName)) {
				function myFunc(token, payment_id, order_no) {
					sfcc.updatePaymentService(token, order_no, payment_id, orderTotal, (error, result) => {
						if (error) {
							console.log(error);
						} else {
							console.log(result);
						}
					});
				};
				sfcc.placeOrderService(token, basketId, (error, result) => {
					if (error) {
						console.log(error);
					} else {
						payment_id = result.payment_id;
						orderCode = result.code;
						if (lang == 'en-us' || lang == 'en-in') {
							text = `Okay, good luck with Thomas tomorrow and watch out for sore legs on Friday`;
						} else {
							text = `Ok, lykke til med Thomas i morgen og du bør kanskje forberede deg på stive lår på fredag`;
						}
						messageData = {
							speech: text,
							displayText: text
						}
						res.send(messageData);
						setTimeout(() => myFunc(token, result.payment_id, result.code), 3000);
					}
				});
			}
		}
			break;

		default:
			//unhandled action, just send back the text
			console.log("***** Action doesnot exists ***** "+actionName);
			break;
	}
});


function isDefined(obj) {
	if (typeof obj == 'undefined') {
		return false;
	}

	if (!obj) {
		return false;
	}

	return obj != null;
}

// Spin up the server
app.listen(app.get('port'), function () {
	console.log("***** Server Started ***** ");
	console.log(' ***** Running on port ***** ', app.get('port'))
})
