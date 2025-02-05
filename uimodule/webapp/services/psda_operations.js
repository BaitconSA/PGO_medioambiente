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

		postWorkflow: async function (body) {
			const resp = await fetch(`${this._urlWF}/v1/xsrf-token`, {
			  method: "GET",
			  headers: {
				"X-CSRF-Token": "Fetch",
			  },
			});
			const token = resp.headers.get("x-csrf-token");
			const response = await fetch(`${this._urlWF}/v1/workflow-instances`, {
			  method: "POST",
			  headers: {
				"X-CSRF-Token": token,
				"Content-Type": "application/json",
			  },
			  body: JSON.stringify(body),
			});
			return response;
		  },

		  postWorkflow: async function (body) {
			const resp = await fetch(`${this._urlWF}/v1/xsrf-token`, {
			  method: "GET",
			  headers: {
				"X-CSRF-Token": "Fetch",
			  },
			});
			const token = resp.headers.get("x-csrf-token");
			const response = await fetch(`${this._urlWF}/v1/workflow-instances`, {
			  method: "POST",
			  headers: {
				"X-CSRF-Token": token,
				"Content-Type": "application/json",
			  },
			  body: JSON.stringify(body),
			});
			return response;
		  },

		  createFolderDMS: async function (Obra, Proveedor, P3) {
			const urlPrincipal = `${this._urlDMS}/Obras/${Obra}_${Proveedor}/${P3}`;

			const respFolderRegistros = await fetch(urlPrincipal, {
			  method: "POST",
			  body: this.getFormDMS(`Planilla Seguimiento Desempenio Ambiental`),
			});
			return await Promise.all([
			  respFolderRegistros.json(),
			]); 
		  },
	  
		  getFormDMS: function (folder) {
			const oForm = new FormData();
			oForm.append("cmisaction", "createFolder");
			oForm.append("propertyId[0]", "cmis:name");
			oForm.append("propertyValue[0]", folder);
			oForm.append("propertyId[1]", "cmis:objectTypeId");
			oForm.append("propertyValue[1]", "cmis:folder");
			oForm.append("_charset_", "UTF-8");
			oForm.append("succinct", true);
			return oForm;
		  },
	  
		  postDMSFile: async function (File, Obra, Proveedor, P3, PI, Folder) {
			const url = `${this._urlDMS}/Obras/${Obra}_${Proveedor}/${P3}/${Folder}/`;
			const oForm = new FormData();
			oForm.append("cmisaction", "createDocument");
			oForm.append("propertyId[0]", "cmis:name");
			oForm.append("propertyValue[0]", File.name);
			oForm.append("propertyId[1]", "cmis:objectTypeId");
			oForm.append("propertyValue[1]", "cmis:document");
			oForm.append("_charset_", "UTF-8");
			oForm.append("includeAllowableActions", true);
			oForm.append("succinct", true);
			oForm.append("media", File);
			const resp = await fetch(url, {
			  method: "POST",
			  body: oForm,
			});
			return await resp.json();
		  },
	  
		  getFileDMS: async function (Obra, Proveedor, P3, PI, Folder, FileName) {
			const url = `${this._urlDMS}/Obras/${Obra}_${Proveedor}/${P3}/${PI}/Registros de obra/${Folder}/${FileName}`;
			const image = await fetch(url);
			return await image.blob();
		  },
	  
		  deleteFileDMS: async function (Obra, Proveedor, P3, PI, Folder, FileName) {
			const url = `${this._urlDMS}/Obras/${Obra}_${Proveedor}/${P3}/${PI}/Registros de obra/${Folder}/${FileName}`;
			const oForm = new FormData();
			oForm.append("cmisAction", "delete");
			await fetch(url, {
			  method: 'POST',
			  body: oForm
			});
		  },
	  
		  getSignedFile: async function (oPayload) {
			const url = `${this._urlDocuSignApi}/DocumentsDocuSign`;
			const oData = await fetch(url, {
			  method: "POST",
			  headers: {
				"Content-Type": "application/json",
			  },
			  body: JSON.stringify(oPayload),
			});
			return await oData.blob();
		  },
	  
		  createPdf: async function (oPayload) {
			const url = `${this._urlPdfApi}/`;
			const oData = await fetch(url, {
			  method: "POST",
			  headers: {
				'Content-Type': 'application/json'
			  },
			  body: JSON.stringify(oPayload)
			});
			return await oData.json();
		  },

		  setUrl: function (urlCatalog, _urlWF, urlDMS,  urlUserApi, urlPdfApi) {
			this._urlCatalog = urlCatalog;	
			this._urlWF = _urlWF;
			this._urlDMS = urlDMS;	
			this._urlUserApi = urlUserApi;
			this._urlPdfApi = urlPdfApi;
        },

		getResponsables: function (ID) {
			return this.callGetService(
			  `Responsables?$filter=ID eq ${ID}&$expand=gerencia($expand=gerente),direccion($expand=director),inspectores($expand=inspector($expand=jefe_area,jefe_inspeccion($expand=jefe_area)))`
			);
		  },




        onCreatePsdaDocument: async function (oPayload, oView ) {
            try {
                const oNewPsdaDocument = await this.callPostService("InformesDesempenioAmbiental", oPayload);
                let message = null;

                if (oNewPsdaDocument.error) {
                    message = "Error al crear el documento PSDA";
                    Utils.showMessage( message , "Error", "ERROR");
                    Utils.dialogBusy(false);
                    return;
                  }
                message = "Documento PSDA creado con éxito.";
                // Invocar el MessagePopover usando el MessageHandler
                Utils.showMessage( message , "Creación de Documento", "SUCCESS");

                return oNewPsdaDocument;
            } catch (error) {
                console.error("Error al crear el documento:", error);
                throw error;  // Puedes manejar este error de otras maneras si lo prefieres
            }
        },

        getInformes: function () {
            const expandParams = [
				"estado,desempenio_nota_pedido($expand=nota_pedido)"
			].join("");
		
			//const url = `Obras/${ID}?$expand=${expandParams}`;
			const url = `InformesDesempenioAmbiental?$expand=${expandParams}`;
		
			return this.callGetService(url);
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

				  // Envío de Notificación

			} catch ( error ) {
				console.error("Error al enviar el documento:", error);
                throw error;  // Puedes manejar este error de otras maneras si lo prefieres
			}
		},

		onAprovePSDA: async function( sEntity, ID ) {
			try { 
				const onChangeStatus = await this.callActionInbounService( sEntity + `(${ID})/aprobar`);
				let message = "";

				if (onChangeStatus.error) {
                    message = "Error al aprobar el documento PSDA";
                    Utils.showMessage( message , "Error", "ERROR");
                    Utils.dialogBusy(false);
                    return;
                  }
				  message = "Documento PSDA aprobado con éxito.";
				  // Invocar el MessagePopover usando el MessageHandler
				  Utils.showMessage( message , "Aprobación", "SUCCESS");
				  Utils.dialogBusy(false);
			} catch ( error ) {
				console.error("Error al aprobar el documento:", error);
                throw error;  // Puedes manejar este error de otras maneras si lo prefieres
			}
		},

		onRejectPSDA: async function( sEntity, ID ) {
			try { 
				const onChangeStatus = await this.callActionInbounService( sEntity + `(${ID})/rechazar`);
				let message = "";

				if (onChangeStatus.error) {
                    message = "Error al rechazar el documento PSDA";
                    Utils.showMessage( message , "Error", "ERROR");
                    Utils.dialogBusy(false);
                    return;
                  }
				  message = "Documento PSDA rechazado con éxito.";
				  // Invocar el MessagePopover usando el MessageHandler
				  Utils.showMessage( message , "Devolución", "SUCCESS");
				  Utils.dialogBusy(false);
			} catch ( error ) {
				console.error("Error al rechazar el documento:", error);
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
		},

		deleteRow: async function (ID) {
			try {
				Utils.dialogBusy(true);
				const oDeletePSDA = await this.callDeleteService(`InformesDesempenioAmbiental/${ID}`);
				let message = "";
		
				if (oDeletePSDA.error) {
					message = "Error al eliminar el documento planilla seguimiento ambiental";
					Utils.showMessage(message, "Error", "ERROR");
					Utils.dialogBusy(false);
					return;
				}
		
				message = "Documento PSDA eliminado con éxito.";
				// Invocar el MessagePopover usando el MessageHandler
				Utils.showMessage(message, "Actualización Exitosa", "SUCCESS");
				Utils.dialogBusy(false);
			} catch (error) {
				Utils.dialogBusy(false);
				console.error("Error al eliminar el documento:", error);
				throw error;  // Puedes manejar este error de otras maneras si lo prefieres
			}
		},

		getLastDocument: async function (ID) {
			try {
				const newDocument = await this.callGetService(`/getDataMedioAmbiente(ID=${ID})`);
				console.log("New Document:", newDocument);  // Verificar qué obtenemos del servicio
				return newDocument;
			} catch (error) {
				console.error("Error al obtener el documento:", error);  // Mensaje de error más descriptivo
				throw error;  // Puedes manejar este error de otras maneras si lo prefieres
			}
		},
		

		_sendWorkflowNotification: async function( sSectionTab, oDataDocument, aRecipients, sAction )  {

			if ( sAction === "SendToApprove") {
				try {
					const oWfPayload = {
						"definitionId": "pgo.wfnotificacion",
						"context": {
							"subject": `${oDataDocument.nombreObra} - Planilla Seguimiento Desempeño Ambiental`,
							"description": `Tiene datos o documentación para evaluar.
								Puede acceder al documento desde Gestionar Obras -> Acciones -> Documentación -> Medioambiente y Calidad -> Sección ${sSectionTab} -> Planilla N° ${oDataDocument.numero_planilla}`,
							"recipients": aRecipients
						}
					};
	
					const oResponseWf = await this.postWorkflow(oWfPayload);
					if (oResponseWf.status !== 201) {
						let message = "Error al enviar la notificación";
						Utils.showMessage(message, "Error", "ERROR");
					} else {
						Utils.showMessage("Notificación enviada exitosamente", "Éxito", "SUCCESS");
					}
				} catch (error) {
					console.error("Error al enviar la notificación de workflow:", error);
					Utils.showMessage("Error al enviar la notificación de workflow", "Error", "ERROR");
				}
			} else {
				try {
					const oWfPayload = {
						"definitionId": "pgo.wfnotificacion",
						"context": {
							"subject": `${oDataDocument.nombreObra} - Planilla Seguimiento Desempeño Ambiental`,
							"description": `La planilla N° ${oDataDocument.numero_planilla} ha sido rechazada.
								Puede acceder al documento desde Gestionar Obras -> Acciones -> Documentación -> Medioambiente y Calidad -> Sección ${sSectionTab} -> Planilla N° ${oDataDocument.numero_planilla}`,
							"recipients": aRecipients
						}
					};
	
					const oResponseWf = await this.postWorkflow(oWfPayload);
					if (oResponseWf.status !== 201) {
						let message = "Error al enviar la notificación";
						Utils.showMessage(message, "Error", "ERROR");
					} else {
						Utils.showMessage("Notificación enviada exitosamente", "Éxito", "SUCCESS");
					}
				} catch (error) {
					console.error("Error al enviar la notificación de workflow:", error);
					Utils.showMessage("Error al enviar la notificación de workflow", "Error", "ERROR");
				}
			}

		}
		
        


	};
});