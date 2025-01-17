// @ts-nocheck
sap.ui.define([
	"sap/ui/core/mvc/Controller",
    "uimodule/utils/utils"
], function (Controller, Utils) {
	"use strict";

	return {

		_urlCatalog: null,
		_urlDMS: null,
		_urlPdfApi: null,
		_urlUserApi: null,
		_urlWF: null,

		promisizer: function (oOptions) {
			return this.toPromise(jQuery.ajax(oOptions));
		},

		toPromise: function (oPromise) {
			return new Promise(function (resolve, reject) {
				oPromise.then(() => {
					const sHeaders = oPromise.done().getAllResponseHeaders();
					const aHeaders = sHeaders.trim().split(/[\r\n]+/);
					const oHeaderMap = {};
					aHeaders.forEach(function (sLine) {
						const aParts = sLine.split(': ');
						const sHeader = aParts.shift();
						const sValue = aParts.join(': ');
						oHeaderMap[sHeader] = sValue;
					});
					resolve([oPromise.done().responseJSON, oHeaderMap]);
				}, reject);
			});
		},

		callGetService: function (sEntity) {
			return new Promise((res, rej) => {
				fetch(`${this._urlCatalog}/${sEntity}`)
					.then((response) => response.json())
					.then((oData) => (oData.error ? rej(oData.error) : res(oData)))
					.catch((err) => rej(err));
			});
		},

		callPostService: function (sEntity, oPayload) {
			return new Promise((res, rej) => {
				fetch(`${this._urlCatalog}/${sEntity}`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify(oPayload),
				})
					.then((response) => response.json())
					.then((oData) => (oData.error ? rej(oData.error) : res(oData)))
					.catch((err) => rej(err));
			});
		},

		callActionInbounService: function (sEntity) {
			return new Promise((res, rej) => {
			  fetch(`${this._urlCatalog}/${sEntity}`, {
				method: "POST",
				headers: {
				  "Content-Type": "application/json",
				},
			  })
				.then(async function (response) {
				  if (response.ok) {
					res(response)
				  } else {
					const oError = await response.json();
					rej(oError.error);
				  }
				})
				.catch((err) => rej(err));
			});
		  },

		callUpdateService: function (sEntity, oPayload) {
			return new Promise((res, rej) => {
				fetch(`${this._urlCatalog}/${sEntity}`, {
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(oPayload),
				})
					.then((response) => response.json())
					.then((oData) => (oData.error ? rej(oData.error) : res(oData)))
					.catch((err) => rej(err));
			});
		},

		callDeleteService: function (sEntity) {
			return new Promise((res, rej) => {
				fetch(`${this._urlCatalog}/${sEntity}`, {
					method: "DELETE",
				})
					.then((response) => res(response))
					.catch((err) => rej(err));
			});
		},

		setUrl: function (urlCatalog) {
			this._urlCatalog = urlCatalog;		
        },

        getInformes: function () {
            const expandParams = [
				"desempenio,estado"
			].join("");
		
			//const url = `Obras/${ID}?$expand=${expandParams}`;
			const url = `InformesAmbientales?$expand=${expandParams}`;
		
			return this.callGetService(url);
        },

        onCreateIaDocument: async function (oPayload, oView ) {
            try {
                const oNewIaDocument = await this.callPostService("InformesAmbientales", oPayload);
                let message = null;

                if (oNewIaDocument.error) {
                    message = "Error al crear el documento Informe Ambiental";
                    Utils.showMessage( message , "Error", "ERROR");
                    Utils.dialogBusy(false);
                    return;
                  }
                message = "Documento de informe ambiental creado con éxito.";
                // Invocar el MessagePopover usando el MessageHandler
                Utils.showMessage( message , "Creación de Documento", "SUCCESS");

                return oNewCdaDocument;
            } catch (error) {
                console.error("Error al crear el documento:", error);
                throw error;  // Puedes manejar este error de otras maneras si lo prefieres
            }
        },


		onSendPSDA: async function( sEntity, ID ) {
			try { 
				const onChangeStatus = await this.callActionInbounService( sEntity + `(${ID})/enviar`);
				let message = "";

				if (onChangeStatus.error) {
                    message = "Error al enviar documento PSDA";
                    Utils.showMessage( message , "Error", "ERROR");
                    Utils.dialogBusy(false);
                    return;
                  }
				  message = "Documento PSDA enviado con éxito.";
				  // Invocar el MessagePopover usando el MessageHandler
				  Utils.showMessage( message , "Envío de aprobación", "SUCCESS");
				  Utils.dialogBusy(false);
			} catch ( error ) {
				console.error("Error al enviar el documento:", error);
                throw error;  // Puedes manejar este error de otras maneras si lo prefieres
			}
		},

		onUpdatePsdaDocument: async function (ID, oPayload, oView) {			
			try { 
				const oUpdatePSDA = await this.callUpdateService(`InformesDesempenioAmbiental/${ID}`, oPayload);
				let message = "";

				if (oUpdatePSDA.error) {
                    message = "Error al actualizar el documento PSDA";
                    Utils.showMessage( message , "Error", "ERROR");
                    Utils.dialogBusy(false);
                    return;
                  }
				  message = "Documento PSDA actualizado con éxito.";
				  // Invocar el MessagePopover usando el MessageHandler
				  Utils.showMessage( message , "Actualización Exitosa", "SUCCESS");
				  Utils.dialogBusy(false);
			} catch ( error ) {
				Utils.dialogBusy(false);
				console.error("Error al actualizar el documento:", error);
                throw error;  // Puedes manejar este error de otras maneras si lo prefieres
			}
		}
        


	};
});