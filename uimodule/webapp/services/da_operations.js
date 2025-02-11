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
		
		createFolderDMS: async function (oObra_ID, oRegistro, oP3) {
			let basePath = `${this._urlDMS}/Obras`;
		
			// Verificar y crear cada carpeta en orden
			basePath = await this.ensureFolderExists(basePath, `${oObra_ID}_${oRegistro}`);
			basePath = await this.ensureFolderExists(basePath, oP3);
			basePath = await this.ensureFolderExists(basePath, "Documentos Adicionales");
		  }, 

		  ensureFolderExists: async function (parentPath, folder) {
			const folderPath = `${parentPath}/${folder}`;
			const exists = await this.checkFolderExists(folderPath);
		
			if (!exists) {
				console.log(`⚠️ La carpeta ${folder} NO existe. Creando en: ${folderPath}`);
				await this.createFolder(parentPath, folder);
			} else {
				console.log(`✅ La carpeta ${folder} YA existe en: ${folderPath}`);
			}
		
			return folderPath; // Devuelve el nuevo path para continuar con la jerarquía
		},

		checkFolderExists: async function (url) {
			try {
				const response = await fetch(url, { method: "GET" });
				return response.ok; // Devuelve true si la carpeta existe
			} catch (error) {
				console.error("Error verificando la carpeta:", error);
				return false;
			}
		},

		createFolder: async function (path, folder) {
			const url = `${path}`;
			const oForm = new FormData();
			oForm.append("cmisaction", "createFolder");
			oForm.append("propertyId[0]", "cmis:name");
			oForm.append("propertyValue[0]", folder);
			oForm.append("propertyId[1]", "cmis:objectTypeId");
			oForm.append("propertyValue[1]", "cmis:folder");
			oForm.append("_charset_", "UTF-8");
			oForm.append("succinct", true);
		
			const resp = await fetch(url, {
				method: "POST",
				body: oForm,
			});
		
			return await resp.json();
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
		  
		  postDMSFile: async function (file, Obra, Proveedor, P3, Folder) {
			const uploadUrl = `${this._urlDMS}/Obras/${Obra}_${Proveedor}/${P3}/${Folder}`;
			const oForm = new FormData();
			oForm.append("cmisaction", "createDocument");
			oForm.append("propertyId[0]", "cmis:name");
			oForm.append("propertyValue[0]", file.PSDA_firmada_nombre);
			oForm.append("propertyId[1]", "cmis:objectTypeId");
			oForm.append("propertyValue[1]", "cmis:document");
			oForm.append("file", file);
			oForm.append("_charset_", "UTF-8");
		
			try {
				const resp = await fetch(uploadUrl, {
					method: "POST",
					body: oForm,
				});
		
				if (resp.ok) {
					const data = await resp.json();
					console.log("Archivo subido exitosamente:", data);
					return data;
				} else {
					console.error("Error al subir el archivo:", resp.statusText);
				}
			} catch (error) {
				console.error("Error durante la subida del archivo:", error);
			}
		
			return false;
		},

		  
		/*
		  getFileDMS: async function (sObraID, sRegistroProveedor, sP3Codigo, sFolder, oDocumentData) {
			debugger
			const url = `${this._urlDMS}/${sObraID}_${sRegistroProveedor}/${sP3Codigo}/${sFolder}/${oDocumentData}`;
			const file = await fetch(url);
			return await file.blob();
		  },
		*/

		  getFileDMS: async function (sObraID, sRegistroProveedor, sP3Codigo, sFolder, oDocumentData) {
			const downloadUrl = `${this._urlDMS}/${sObraID}_${sRegistroProveedor}/${sP3Codigo}/${sFolder}/${oDocumentData}`;
		
			try {
				const resp = await fetch(downloadUrl, {
					method: "GET",
				});
		
				if (resp.ok) {
					const blob = await resp.blob();
					console.log(`Archivo ${oDocumentData} descargado exitosamente del DMS.`);
					return blob;
				} else {
					console.error(`Error al descargar el archivo ${oDocumentData}:`, resp.statusText);
					return null;
				}
			} catch (error) {
				console.error(`Error durante la descarga del archivo ${oDocumentData}:`, error);
				return null;
			}
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

        getDocumentos: async function () {
            const expandParams = [
				"desempenio,estado"
			].join("");
		
			//const url = `Obras/${ID}?$expand=${expandParams}`;
			const url = `DocumentacionAdicionalDesempenio?$expand=${expandParams}`;
		
			return this.callGetService(url);
        },

		getLastDocument: async function (ID) {
		
			//const url = `Obras/${ID}?$expand=${expandParams}`;
			const url = `DocumentacionAdicionalDesempenio?$filter=ID eq ${ID}`;
		
			return this.callGetService(url);
		},

        onCreateDaDocument: async function (oPayload, oView ) {
            try {
                const oNewDaDocument = await this.callPostService("DocumentacionAdicionalDesempenio", oPayload);
                let message = null;

                if (oNewDaDocument.error) {
                    message = "Error al crear el documento adicional";
                    Utils.showMessage( message , "Error", "ERROR");
                    Utils.dialogBusy(false);
                    return;
                  }
                message = "Documento adicional creado con éxito.";
                // Invocar el MessagePopover usando el MessageHandler
                Utils.showMessage( message , "Creación de Documento", "SUCCESS");

                return oNewDaDocument;
            } catch (error) {
                console.error("Error al crear el documento:", error);
                throw error;  // Puedes manejar este error de otras maneras si lo prefieres
            }
        },

		deleteRow: async function (ID) {
			try {
				Utils.dialogBusy(true);
				const oDeletePSDA = await this.callDeleteService(`DocumentacionAdicionalDesempenio/${ID}`);
				let message = "";
		
				if (oDeletePSDA.error) {
					message = "Error al eliminar el documento adicional";
					Utils.showMessage(message, "Error", "ERROR");
					Utils.dialogBusy(false);
					return;
				}
		
				message = "Documento adicional eliminado con éxito.";
				// Invocar el MessagePopover usando el MessageHandler
				Utils.showMessage(message, "Actualización Exitosa", "SUCCESS");
				Utils.dialogBusy(false);
			} catch (error) {
				Utils.dialogBusy(false);
				console.error("Error al eliminar el documento:", error);
				throw error;  // Puedes manejar este error de otras maneras si lo prefieres
			}
		},


		onUpdateDaDocument: async function (ID, oPayload, oView) {			
			try { 
				const oUpdateCDA = await this.callUpdateService(`DocumentacionAdicionalDesempenio/${ID}`, oPayload);
				let message = "";

				if (oUpdateCDA.error) {
                    message = "Error al actualizar el documento Adicional";
                    Utils.showMessage( message , "Error", "ERROR");
                    Utils.dialogBusy(false);
                    return;
                  }
				  message = "Documento adicional actualizado con éxito.";
				  // Invocar el MessagePopover usando el MessageHandler
				  Utils.showMessage( message , "Actualización Exitosa", "SUCCESS");
				  Utils.dialogBusy(false);
			} catch ( error ) {
				Utils.dialogBusy(false);
				console.error("Error al actualizar el documento:", error);
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

		
		onSendDA: async function( sEntity, ID ) {
			try { 
				const onChangeStatus = await this.callActionInbounService( sEntity + `(${ID})/enviar`);
				let message = "";

				if (onChangeStatus.error) {
                    message = "Error al enviar documento adicional";
                    Utils.showMessage( message , "Error", "ERROR");
                    Utils.dialogBusy(false);
                    return;
                  }
				  message = "Documento documento adicional enviado con éxito.";
				  // Invocar el MessagePopover usando el MessageHandler
				  Utils.showMessage( message , "Envío de documentación", "SUCCESS");
				  Utils.dialogBusy(false);
			} catch ( error ) {
				console.error("Error al enviar el documento:", error);
                throw error;  // Puedes manejar este error de otras maneras si lo prefieres
			}
		},
		
		onAproveDA: async function( sEntity, ID ) {
			try { 
				const onChangeStatus = await this.callActionInbounService( sEntity + `(${ID})/aprobar`);
				let message = "";

				if (onChangeStatus.error) {
                    message = "Error al aprobar el documento adicional";
                    Utils.showMessage( message , "Error", "ERROR");
                    Utils.dialogBusy(false);
                    return;
                  }
				  message = "Documento documento adicional evaluado con éxito.";
				  // Invocar el MessagePopover usando el MessageHandler
				  Utils.showMessage( message , "Aprobación", "SUCCESS");
				  Utils.dialogBusy(false);
			} catch ( error ) {
				console.error("Error al aprobar el documento:", error);
                throw error;  // Puedes manejar este error de otras maneras si lo prefieres
			}
		},

		onRejectDA: async function( sEntity, ID ) {
			try { 
				const onChangeStatus = await this.callActionInbounService( sEntity + `(${ID})/rechazar`);
				let message = "";

				if (onChangeStatus.error) {
                    message = "Error al rechazar el documento adicional";
                    Utils.showMessage( message , "Error", "ERROR");
                    Utils.dialogBusy(false);
                    return;
                  }
				  message = "Documento adicional rechazado con éxito.";
				  // Invocar el MessagePopover usando el MessageHandler
				  Utils.showMessage( message , "Devolución", "SUCCESS");
				  Utils.dialogBusy(false);
			} catch ( error ) {
				console.error("Error al rechazar el documento adicional:", error);
                throw error;  // Puedes manejar este error de otras maneras si lo prefieres
			}
		},

		_sendWorkflowNotification: async function( sSectionTab, oDataDocument, aRecipients, sAction, perfil )  {
			let message = "";
			if(perfil === "Contratista" || perfil === "Inspector" || perfil === "JefeInspeccion" || perfil === "JefeArea"){
				message = "Tiene datos o documentación para evaluar."
			} else {
				message = "Documento evaluado con éxito."
			}
			if ( sAction === "SendToApprove") {
				try {
					const oWfPayload = {
						"definitionId": "pgo.wfnotificacion",
						"context": {
							"subject": `${oDataDocument.nombreObra} - Planilla Documento Adicional`,
							"description": `${message}
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
							"subject": `${oDataDocument.nombreObra} - Planilla Documento Adicional`,
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