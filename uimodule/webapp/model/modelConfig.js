sap.ui.define(
	["sap/ui/model/json/JSONModel", "sap/base/Log"],
	function (JSONModel, Log) {
		"use strict";

		return {
			createMainModel: function () {
				return new JSONModel({
					// Datos de La Obra General
					ObraData: {},
					DateStartWork: null,

					//Estado de la Obra General
					ObraStatus: {
                        state: null, // Estado de la obra (Ej: "En progreso", "Finalizada", "Cancelada")
                        color: null // Comentarios sobre el estado de la obra
                    },
					// Datos de usuario
					UserRoles: {},
					UserData: {},
					Permissions: {},

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
						Messages: []
					},

					Years: [], // Array para almacenar los años
					DatosFormularioPSDA:{
						payloadType: "datosFormularioPSDA",
						payload: {
								NumeroNotaPedido: "",
							Subproductos: {
								Madera: "",
								Metal: "",
								Plastico: "",
								Agregados: "",
								ExcesoTierra: "",
								PapelCarton: ""
							},
							Residuos: {
								ResiduosLiquidos: "",
								ResiduosSolidos: "",
								ResiduosGenerales: "",
								ResiduosEspeciales: "",
								ResiduosAlcantarillado: "",
								ResiduosPatogenos: ""
							},
							Reclamos: {
								NumeroReclamos: ""
							},
							Energia: {
								ConsumoEnergia: "",
								ConsumoCombustible: ""
							},
							Capacitacion: {
								HorasCapacitacion: ""
							},
							ComentariosGenerales: "",
							PSDA_Firmada: ""
						}
					}
					
				});
			},

			// Nueva función para estructurar el modelo de datos basado en oObraData
			// eslint-disable-next-line complexity, consistent-return
			createStructuredModel: function (oModel, oObraData, oUserData, oUserRolesData) {

					// Listas P3 y PI
					let sStateObra = (oObraData && oObraData["estado"] && oObraData["estado"].ID) || "",
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

					// Ejemplo de uso 
					this.updateObraStatus(oModel, sStateObra, sStateObraDescription);
                    
                    oModel.setProperty( "/ObraData", oObraData );
					oModel.setProperty( "/DateStartWork", sYearInicioObra );
                    oModel.setProperty( "/UserData", oUserData );
                    oModel.setProperty( "/UserRoles", oUserRolesData );
                    oModel.setProperty( sPathSection + "/aP3List", P3List );
                    oModel.setProperty( sPathSection + "/aPIList", PIList );
					oModel.setProperty( sPathSection + "/sP3IDDefault", P3IDefault );
                    oModel.setProperty( sPathSection + "/sPIIDefault", PIIDefault );

                    return oModel;
				
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
                    (P3) => P3.ID === sKeyP3
                );

				const emptyOrderNote = { nro_nota_pedido: "", descripcion: "Seleccione del listado una Nota de Pedido -" };
				const aOrderNotes = [emptyOrderNote, ...aP3Selected[0].nota_pedido.filter(np => np.estado_ID !== "BO")];

				debugger;
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