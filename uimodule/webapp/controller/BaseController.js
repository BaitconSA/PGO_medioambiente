sap.ui.define(
	["sap/ui/core/mvc/Controller",
		"sap/ui/core/routing/History",
		"sap/ui/core/UIComponent",
		"sap/m/MessageStrip"],
	function (Controller, History, UIComponent, MessageStrip) {
		"use strict";

		return Controller.extend("uimodule.controller.BaseController", {

			getModel: function (sName) {
				return this.getView().getModel(sName);
			},

			setModel: function (oModel, sName) {
				return this.getView().setModel(oModel, sName);
			},

			getResourceBundle: function () {
				return this.getOwnerComponent().getModel("i18n").getResourceBundle();
			},

			navTo: function (psTarget, pmParameters, pbReplace) {
				this.getRouter().navTo(psTarget, pmParameters, pbReplace);
			},

			getRouter: function () {
				return UIComponent.getRouterFor(this);
			},

			onNavBack: function () {
				this.getRouter().navTo("MainView", {});
			},

			_showMessage: function (oView, sTitle, sText, sType) {
				var oMessageStrip = oView.byId("messageStrip");
	
				oMessageStrip.setText(`${sTitle}: ${sText}`);
				oMessageStrip.setType(sType);
				oMessageStrip.setVisible(true);
			}
	
		

		});
	},
);