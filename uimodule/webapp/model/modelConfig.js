sap.ui.define(
	["sap/ui/model/json/JSONModel", 
	"sap/base/Log",
	"uimodule/model/formatter"],
	function (JSONModel, Log, Formatter) {
		"use strict";

		return {
			createMainModel: function () {
				return new JSONModel({
					// Datos de La Obra General
					ObraData: {},
					ObraID: null,
					DateStartWork: null,

					//Estado de la Obra General
					ObraStatus: {
                        state: null, // Estado de la obra (Ej: "En progreso", "Finalizada", "Cancelada")
                        color: null // Comentarios sobre el estado de la obra
                    },
					// Datos de usuario
					UserRoles: {},
					UserData: {},
					UsuariosMedioAmbientes: [],
					UserActionPermissions: {
						canUploadEditEnvironmentResponsable: false,
						canUploadPSDA: false,
						canUploadCDA: false,
						canUploadIA: false,
						canUploadDA: false,
					},
					// Información del header
					HeaderInfo: {
						workName: null,
						razonSocial: null,
						p3: null,
						p3Description: null,
						fluid: null,
						contractType: null,
                        management: null,
                        partido: null,
                        supplierRegistration: null,
                        hiringSystem: null
						// Agregar más propiedades según sea necesario
					},

					Section: {
						aP3List: [],
						aPIList: [],
                        aP3Selected: {},
						aPiSelected: {},
						oPiID: null,
						sP3IDDefault: null,
						sPIIDefault: null
					},

					managementOptionsIcon:{
						PSDAData: [], // Agregar más navegadores según sea}]
					},

					OrderNotes: [], // Array de objetos que son los datos de las notas de orden
					OrderNotesTableData: [], // Información en tabla de Orden de Notas,
					OrderNotesTableEditData: [], // Información en tabla de Orden de Notas pero EDICIÓN

					// Datos de la tabla
					TableData: [], // Array de objetos que son los datos de la tabla
					TableHeaders: {
						RecordCount: 0, // Cantidad de registros de la tabla
						Columns: [] // Array de las cabeceras de la tabla
					},
					// Documentación a agregar a la tabla de rescisión
					DocumentInformation: {
						File: {},
						FileName: null,
						DocumentacionAdicional: {}
					},

					Payload: {
						environmentalResponsive: null
					},

					// Preload
					Preload: {
						IsLoading: true, // Indicador de si los datos están siendo cargados
						Data: [] // Datos pre-cargados
					},

					// Validaciones
					Validations: {
						IsValid: true,
						valueStateMesInformar: null,
						valueStateTextMesInformar: null,
						valueStateEnvironmentalResponsive: null,
						valueStateTextEnvironmentalResponsive: null,
						Messages: []
					},

					Years: [], // Array para almacenar los años
					IDMainEntity: null,
					ResponsableAmbiental: {},
					DatosFormularioPSDA:{
						payloadType: "datosFormularioPSDA",
						payload: {
							NumeroNotaPedido: null,
							mesAinformar: null,
							PSDA_Firmada: null,
							documento: {
								DocumentacionAdicional: {},
								File: {},
								FileName: null
							},
							validation: {
								documentPsdaValueState:null,
								documentPsdaValueStateText: null,
							}
						},
						TablePSDA: {
							Data:[],
							selectedRow: {},
							documentAttachmentData: [], // Datos del documento adjuntado
							numeroPlanilla: null,
							mesInformar: null,
							control: {},
							fechaEntrega: null
						},
						EditSection: {
							Data:[],
							selectedRow: {},
							numeroPlanilla: null,
							mesInformar: null,
							control: {},
							documentAttachmentData: [], // Datos del documento adjuntado
							fechaEntrega: null,
							isEdit: false,
							documento: {
								DocumentacionAdicional: {},
								File: {},
								FileName: null
							},
							validation: {
								mesInformarValueState: null,
								mesInformarTextValueState: null,
								documentPsdaEditValueState:null,
								documentPsdaEditValueStateText: null,
							}
						}

					},
					// Otros datos adicionales
					DatosFormularioCDA: {
						payload: {
							// Agregar más propiedades según sea necesario
							uploadCDA: {
								FechaDeteccion: null,
								documento: {
									DocumentacionAdicional: {},
									File: {},
									FileName: null
								},
								validation: {
									dateOfDetectionValueState: null,
									dateOfDetectionTextValueState: null,
									documentCdaValueState:null,
									documentCdaEditValueStateText: null,
								},
								documentAttachmentData: [], // Datos del documento adjuntado
							},
						},
						TableCDA: {
							Data: []
						},
						DetailSection: {
							selectedRow: {},
							documentAttachmentData: [], // Datos del documento adjuntado
						},
						EditSection: {
							Data:[],
								selectedRow: {},
								numeroPlanilla: null,
								documentAttachmentData: [], // Datos del documento adjuntado
								fechaEntrega: null,
								isEdit: false,
								FechaDeteccion: null,
								documento: {
									DocumentacionAdicional: {},
									File: {},
									FileName: null
								},
								validation: {
									dateOfDetectionValueState: null,
									dateOfDetectionTextValueState: null,
									documentCdaValueState:null,
									documentCdaEditValueStateText: null,
								}
						}
					},

					//DatosFormularioIA
					DatosFormularioIA: {
						payload: {
							// Agregar más propiedades según sea necesario
							uploadIA: {
								documento: {
									DocumentacionAdicional: {},
									File: {},
									FileName: null
								},
								validation: {
									dateOfDetectionValueState: null,
									dateOfDetectionTextValueState: null,
									documentIaValueState:null,
									documentIaEditValueStateText: null,
								},
								documentAttachmentData: [], // Datos del documento adjuntado
							},
						},
						TableIA: {
							Data: []
						},
						DetailSection: {
							selectedRow: {},
							documentAttachmentData: [], // Datos del documento adjuntado
						},
						EditSection: {
								Data:[],
								selectedRow: {},
								numeroPlanilla: null,
								documentAttachmentData: [], // Datos del documento adjuntado
								fechaEntrega: null,
								isEdit: false,
								documento: {
									DocumentacionAdicional: {},
									File: {},
									FileName: null
								},
								validation: {
									documentIaValueState:null,
									documentIaEditValueStateText: null,
								}
						}
					},

					// Documentos Adicionales
					DatosFormularioDA: {
						payload: {
							// Agregar más propiedades según sea necesario
							uploadDA: {
								descripcion: null,
								descripcionValueState: "None",
								descripcionValueStateText: "El campo Descripción es obligatorio",
								comentarios: null,
								documento: {
									DocumentacionAdicional: {},
									File: {},
									FileName: null,
									documentoValueState: "None",
									documentoValueStateText: "Debe adjuntar un documento",
								},
								documentAttachmentData: [], // Datos del documento adjuntado
							}
						},
						TableDA: {
							Data: []
						},
						DetailSection: {
							descripcion: null,
							comentarios: null,
							selectedRow: {},
							documentAttachmentData: [], // Datos del documento adjuntado
						},
						EditSection: {
								Data:[],
								selectedRow: {},
								descripcion: null,
								comentarios: null,
								numeroPlanilla: null,
								documentAttachmentData: [], // Datos del documento adjuntado
								fechaEntrega: null,
								isEdit: false,
								documento: {
									DocumentacionAdicional: {},
									File: {},
									FileName: null
								},
								validation: {
									descripcionValueState: "None",
									descripcionValueStateText: "El campo Descripción es obligatorio",
									documentDAValueState:null,
									documentDAEditValueStateText: null,
								}
						}
					},
				});
			},

			// Nueva función para estructurar el modelo de datos basado en oObraData
			// eslint-disable-next-line complexity, consistent-return
			createStructuredModel: function (oView, oModel, oObraData, oResponsableAmbientalData, oInformesData, 
					oControlesData, oInformesAmbientalesData, oDocumentacionAdicionalData, oUserData, oUserRolesData) {

					// Listas P3 y PI
					let sObraID = oObraData.ID,
						sStateObra = (oObraData && oObraData["estado"] && oObraData["estado"].ID) || "",
					    sStateObraDescription = (oObraData && oObraData["estado"] && oObraData["estado"].descripcion) || "",
						sFechaInicioObra = (oObraData && oObraData["fecha_firma"]) || "",
						sYearInicioObra = sFechaInicioObra.split("-")[0],
					    P3List = [],
						PIList = [],
						P3IDefault = null,
						PIIDefault = null,
                        sPathSection = "/Section";

					if (oObraData.p3) {
						const firstP3 = oObraData.p3[0];
						P3IDefault = firstP3.ID;
						oObraData.p3.forEach((p3) => {
							P3List.push(p3);

							if (p3.pi && p3.pi.length > 0) {
								// Obtener el ID del primer objeto en pi
								const firstPI = p3.pi[0];
								PIIDefault = firstPI.ID;

								p3.pi.forEach((pi) => {
									if (pi.fecha_acta) {
										// eslint-disable-next-line camelcase
										pi.fecha_acta = pi.fecha_acta
											.split(" ")[0]
											.split("-")
											.reverse()
											.join("/");
									}
									PIList.push(pi);
								});
							}
						});
					}

					if(oResponsableAmbientalData.value && oResponsableAmbientalData.value.length > 0 ) {
						oModel.setProperty("/ResponsableAmbiental", oResponsableAmbientalData.value[0] );
						oModel.setProperty("/DesempenioAmbientalID", oResponsableAmbientalData.value[0] );
					}

					if(oUserRolesData["value"].includes("PGO_Contratista")) {
                        oModel.setProperty("/UserActionPermissions/canUploadEditEnvironmentResponsable", true);
                        oModel.setProperty("/UserActionPermissions/canUploadPSDA", true);
                        oModel.setProperty("/UserActionPermissions/canUploadCDA", true);
                        oModel.setProperty("/UserActionPermissions/canUploadIA", true);
                        oModel.setProperty("/UserActionPermissions/canUploadDA", true);
                    } 

					

				if (oInformesData.value && oInformesData.value.length > 0) {
					const oInformesDesempenio = oInformesData.value.map(item => {					
							return {
								...item,
								control: this._getControlForThis(oView,
									item.createdAt,
									item.estado_ID)
							};

					});
					oModel.setProperty("/DatosFormularioPSDA/TablePSDA/Data", oInformesDesempenio);
				} else {
					oModel.setProperty( "/DatosFormularioDA/TablePSDA/Data", [] );
				}

				if( oControlesData.value && oControlesData.value.length > 0 ) {
					oModel.setProperty( "/DatosFormularioCDA/TableCDA/Data", oControlesData.value );
				} else {
					oModel.setProperty( "/DatosFormularioDA/TableCDA/Data", [] );
				}

				if( oInformesAmbientalesData.value && oInformesAmbientalesData.value.length > 0) {
					oModel.setProperty( "/DatosFormularioIA/TableIA/Data", oInformesAmbientalesData.value );
				} else {
					oModel.setProperty( "/DatosFormularioDA/TableIA/Data", [] );
				}

				if( oDocumentacionAdicionalData.value && oDocumentacionAdicionalData.value.length > 0) {
					oModel.setProperty( "/DatosFormularioDA/TableDA/Data", oDocumentacionAdicionalData.value );
				} else {
					oModel.setProperty( "/DatosFormularioDA/TableDA/Data", [] );
				}


					// Ejemplo de uso 
					this.updateObraStatus(oModel, sStateObra, sStateObraDescription);
                    
                    oModel.setProperty( "/ObraData", oObraData );
					oModel.setProperty( "/ObraID", sObraID );
					oModel.setProperty( "/DateStartWork", sYearInicioObra );
                    oModel.setProperty( "/UserData", oUserData );
                    oModel.setProperty( "/UserRoles", oUserRolesData );
                    oModel.setProperty( sPathSection + "/aP3List", P3List );
                    oModel.setProperty( sPathSection + "/aPIList", PIList );
					oModel.setProperty( sPathSection + "/sP3IDDefault", P3IDefault );
                    oModel.setProperty( sPathSection + "/sPIIDefault", PIIDefault );

					oModel.refresh(true);
                    return oModel;
				
			},

			_getControlForThis: function (oView, fechaCreacion, estado, mesInformar) {
				const aEstadoSetOK = ["PI", "PJA", "AP"];
				const aEstadoSet = ["PE", "BO", "RE"];
				const today = new Date();
				today.setHours(0, 0, 0, 0);
			
				const fechaCreacionDate = new Date(fechaCreacion);
			
				// Si mesInformar es vacío o null, usar el mes actual
				const mesInformarDate = mesInformar ? new Date(today.getFullYear(), mesInformar - 1) : new Date(today.getFullYear(), today.getMonth());
			
				// Calcular la fecha límite basado en el mes a informar
				const fechaLimite = new Date(mesInformarDate.getFullYear(), mesInformarDate.getMonth() + 1, 3);
			
				// Calcular la diferencia en días entre hoy y la fecha límite
				const dif = (fechaLimite - today) / (1000 * 60 * 60 * 24);
			
				if (aEstadoSetOK.includes(estado)) {
					return {
						descripcion: oView.getModel("i18n").getResourceBundle().getText("delivered"),
						state: "Success",
					};
				}
			
				if (aEstadoSet.includes(estado) && dif >= 2) {
					return {
						descripcion: oView.getModel("i18n").getResourceBundle().getText("onTime"),
						state: "Success",
					};
				}
			
				if (aEstadoSet.includes(estado) && dif >= 0 && dif < 2) {
					return {
						descripcion: oView.getModel("i18n").getResourceBundle().getText("aboutToExpire"),
						state: "Warning",
					};
				}
			
				if (aEstadoSet.includes(estado) && dif < 0) {
					return {
						descripcion: oView.getModel("i18n").getResourceBundle().getText("expired"),
						state: "Error",
					};
				}
			},
			
			
			updateObraStatus: function (oModel, sStateObra, sStateObraDescription) {
				let sColorState;
				let sFormattedState;
			
				if (sStateObra === "EJ") {
					sColorState = "Success";
					sFormattedState = `<strong>Estado de la Obra: <em>${sStateObraDescription}</em> </strong> <em>Podrá iniciar el monitoreo</em>`;
				} else {
					sColorState = "Warning";
					sFormattedState =`<strong>Estado de la Obra: <em>${sStateObraDescription}</em></strong> No podrá iniciar el monitoreo <em>(La Obra debe estar "En Ejecución")</em>`;
				}
			
				oModel.setProperty("/ObraStatus/state", sFormattedState);
				oModel.setProperty("/ObraStatus/color", sColorState);
			},

			

			buildHeaderInfo: function (oView, oEvent, oModel, sKeyP3) {
				if ( sKeyP3 )
                    oView.byId("IconTabP3_ID").setSelectedKey( sKeyP3 );

				// Por default siempre la primer opción planilla desempeño
				oView.byId("IconTabsOptions").setSelectedKey( "DAPS" );
    
    
                const sKey = sKeyP3 ? sKeyP3 : oEvent.getParameters().selectedKey;
    
                const aP3List = oModel.getProperty( "/Section/aP3List" );
                const oObraData = oModel.getProperty("/ObraData");

                const aP3Selected = aP3List.filter(
                    (P3) => P3.ID === sKey
                );

				const emptyOrderNote = { nro_nota_pedido: "", descripcion: "Seleccione del listado una Nota de Pedido -" };
				const aOrderNotes = [emptyOrderNote, ...aP3Selected[0].nota_pedido.filter(np => np.estado_ID !== "BO")];

                const sPathHeader = "/HeaderInfo";
    
                //********* Header App **********
                const sP3Codigo = aP3Selected[0].codigo,
                    sRazonSocial = oObraData.contratista
                    .map((item) => item.contratista.razonsocial)
                    .join(" - "),
                    sDescripcionP3 = aP3Selected[0].nombre,
                    sFluido = aP3Selected[0].fluido?.descripcion,
                    sContrato = aP3Selected[0].tipo_contrato?.descripcion,
                    sPartido = aP3Selected[0].partido?.descripcion,
                    sRegistroProveedor = oObraData.contratista[0]?.contratista.registro_proveedor;
                //********* FIN Header App **********
    
                oModel.setProperty( sPathHeader + "/workName", oObraData.nombre );
                oModel.setProperty( sPathHeader + "/razonSocial", sRazonSocial );
                oModel.setProperty( sPathHeader + "/p3", sP3Codigo);
                oModel.setProperty( sPathHeader + "/p3Description", sDescripcionP3 );
                oModel.setProperty( sPathHeader + "/fluid", sFluido );
                oModel.setProperty( sPathHeader + "/contractType", sContrato );
                oModel.setProperty( sPathHeader + "/partido", sPartido );
                oModel.setProperty( sPathHeader + "/supplierRegistration", sRegistroProveedor );
                oModel.setProperty( "/Section/aP3Selected", aP3Selected[0] );
				oModel.setProperty( "/OrderNotes", aOrderNotes );
			}
		};
	}
);