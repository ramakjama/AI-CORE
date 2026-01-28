import { Model303DataDto, Model111DataDto, Model190DataDto, Model347DataDto } from '../dto';

export class XMLGeneratorUtil {
  /**
   * Genera XML para Modelo 303 - Liquidación de IVA
   */
  static generateModel303XML(data: Model303DataDto): string {
    const totalRepercutido =
      (data.ivaRepercutido21?.cuota || 0) +
      (data.ivaRepercutido10?.cuota || 0) +
      (data.ivaRepercutido4?.cuota || 0);

    const totalSoportado = (data.ivaSoportadoDeducible?.cuota || 0);

    const resultado = totalRepercutido - totalSoportado - (data.cuotasCompensarPeriodosAnteriores || 0);

    const resultType = resultado > 0 ? 'I' : resultado < 0 ? 'N' : 'C';
    const resultAmount = Math.abs(resultado);

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:soapenc="http://schemas.xmlsoap.org/soap/encoding/"
               xmlns:xsd="http://www.w3.org/2001/XMLSchema"
               xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <soap:Body>
    <SuministroLR xmlns="https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/burt/jdit/ws/SuministroLR.xsd">
      <Cabecera>
        <IDVersionSii>1.1</IDVersionSii>
        <Titular>
          <NIF>${this.escapeXml(data.nif)}</NIF>
          <NombreRazon>${this.escapeXml(data.companyName)}</NombreRazon>
        </Titular>
        <TipoComunicacion>A0</TipoComunicacion>
      </Cabecera>
      <RegistroLRModelo303>
        <PeriodoLiquidacion>
          <Ejercicio>${data.fiscalYear}</Ejercicio>
          <Periodo>${this.escapeXml(data.period)}</Periodo>
        </PeriodoLiquidacion>
        <DeclaracionLiquidacion>
          ${data.isComplementary ? '<TipoDeclaracion>C</TipoDeclaracion>' : ''}
          ${data.previousSubmissionNumber ? `<NumJustificanteAnterior>${this.escapeXml(data.previousSubmissionNumber)}</NumJustificanteAnterior>` : ''}

          <!-- IVA Repercutido (Ventas) -->
          ${data.ivaRepercutido21 ? `
          <DevengadoPorOperacionesRegimen>
            <BaseImponible21>${this.formatNumber(data.ivaRepercutido21.baseImponible)}</BaseImponible21>
            <CuotaDevengada21>${this.formatNumber(data.ivaRepercutido21.cuota)}</CuotaDevengada21>
          </DevengadoPorOperacionesRegimen>
          ` : ''}

          ${data.ivaRepercutido10 ? `
          <DevengadoPorOperacionesRegimen>
            <BaseImponible10>${this.formatNumber(data.ivaRepercutido10.baseImponible)}</BaseImponible10>
            <CuotaDevengada10>${this.formatNumber(data.ivaRepercutido10.cuota)}</CuotaDevengada10>
          </DevengadoPorOperacionesRegimen>
          ` : ''}

          ${data.ivaRepercutido4 ? `
          <DevengadoPorOperacionesRegimen>
            <BaseImponible4>${this.formatNumber(data.ivaRepercutido4.baseImponible)}</BaseImponible4>
            <CuotaDevengada4>${this.formatNumber(data.ivaRepercutido4.cuota)}</CuotaDevengada4>
          </DevengadoPorOperacionesRegimen>
          ` : ''}

          <TotalCuotasDevengadas>${this.formatNumber(totalRepercutido)}</TotalCuotasDevengadas>

          <!-- IVA Soportado (Compras) -->
          ${data.ivaSoportadoDeducible ? `
          <DeduccionesPorCuotasSoportadas>
            <BaseImponibleDeducible>${this.formatNumber(data.ivaSoportadoDeducible.baseImponible)}</BaseImponibleDeducible>
            <CuotaDeducible>${this.formatNumber(data.ivaSoportadoDeducible.cuota)}</CuotaDeducible>
          </DeduccionesPorCuotasSoportadas>
          ` : ''}

          ${data.ivaSoportadoNoDeducible ? `
          <CuotasSoportadasNoDeducibles>
            <BaseImponibleNoDeducible>${this.formatNumber(data.ivaSoportadoNoDeducible.baseImponible)}</BaseImponibleNoDeducible>
            <CuotaNoDeducible>${this.formatNumber(data.ivaSoportadoNoDeducible.cuota)}</CuotaNoDeducible>
          </CuotasSoportadasNoDeducibles>
          ` : ''}

          <TotalCuotasDeducibles>${this.formatNumber(totalSoportado)}</TotalCuotasDeducibles>

          <!-- Resultado -->
          ${data.cuotasCompensarPeriodosAnteriores ? `
          <ResultadoAnterior>
            <CuotasCompensarPeriodosAnteriores>${this.formatNumber(data.cuotasCompensarPeriodosAnteriores)}</CuotasCompensarPeriodosAnteriores>
          </ResultadoAnterior>
          ` : ''}

          <ResultadoLiquidacion>
            <TipoResultado>${resultType}</TipoResultado>
            <ImporteResultado>${this.formatNumber(resultAmount)}</ImporteResultado>
          </ResultadoLiquidacion>

          ${data.prorrataPercentage ? `
          <Prorrata>
            <PorcentajeProrrata>${this.formatNumber(data.prorrataPercentage)}</PorcentajeProrrata>
          </Prorrata>
          ` : ''}
        </DeclaracionLiquidacion>
      </RegistroLRModelo303>
    </SuministroLR>
  </soap:Body>
</soap:Envelope>`;

    return this.formatXML(xml);
  }

  /**
   * Genera XML para Modelo 111 - Retenciones IRPF
   */
  static generateModel111XML(data: Model111DataDto): string {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:soapenc="http://schemas.xmlsoap.org/soap/encoding/"
               xmlns:xsd="http://www.w3.org/2001/XMLSchema"
               xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <soap:Body>
    <SuministroRetenciones xmlns="https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/burt/jdit/ws/SuministroRetenciones.xsd">
      <Cabecera>
        <IDVersionSii>1.1</IDVersionSii>
        <Titular>
          <NIF>${this.escapeXml(data.nif)}</NIF>
          <NombreRazon>${this.escapeXml(data.companyName)}</NombreRazon>
        </Titular>
        <TipoComunicacion>A0</TipoComunicacion>
      </Cabecera>
      <RegistroModelo111>
        <PeriodoLiquidacion>
          <Ejercicio>${data.fiscalYear}</Ejercicio>
          <Periodo>${this.escapeXml(data.period)}</Periodo>
        </PeriodoLiquidacion>
        <DeclaracionRetenciones>
          ${data.isComplementary ? '<TipoDeclaracion>C</TipoDeclaracion>' : ''}

          <NumeroPerceptores>${data.numberOfRecipients}</NumeroPerceptores>

          <ImporteTotal>
            <BaseRetenciones>${this.formatNumber(data.totalBase)}</BaseRetenciones>
            <TotalRetenciones>${this.formatNumber(data.totalRetained)}</TotalRetenciones>
          </ImporteTotal>

          <DetallePerceptores>
            ${data.retentions.map(retention => `
            <Perceptor>
              <Identificacion>
                <NIF>${this.escapeXml(retention.nif)}</NIF>
                <NombreRazon>${this.escapeXml(retention.name)}</NombreRazon>
              </Identificacion>
              <BaseRetencion>${this.formatNumber(retention.base)}</BaseRetencion>
              <PorcentajeRetencion>${this.formatNumber(retention.percentage)}</PorcentajeRetencion>
              <ImporteRetenido>${this.formatNumber(retention.amount)}</ImporteRetenido>
            </Perceptor>
            `).join('')}
          </DetallePerceptores>
        </DeclaracionRetenciones>
      </RegistroModelo111>
    </SuministroRetenciones>
  </soap:Body>
</soap:Envelope>`;

    return this.formatXML(xml);
  }

  /**
   * Genera XML para Modelo 190 - Resumen Anual IRPF
   */
  static generateModel190XML(data: Model190DataDto): string {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:soapenc="http://schemas.xmlsoap.org/soap/encoding/"
               xmlns:xsd="http://www.w3.org/2001/XMLSchema"
               xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <soap:Body>
    <SuministroResumenAnual xmlns="https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/burt/jdit/ws/SuministroResumenAnual.xsd">
      <Cabecera>
        <IDVersionSii>1.1</IDVersionSii>
        <Titular>
          <NIF>${this.escapeXml(data.nif)}</NIF>
          <NombreRazon>${this.escapeXml(data.companyName)}</NombreRazon>
        </Titular>
        <TipoComunicacion>A0</TipoComunicacion>
      </Cabecera>
      <RegistroModelo190>
        <Ejercicio>${data.fiscalYear}</Ejercicio>
        <ResumenAnual>
          <NumeroTotalPerceptores>${data.totalRecipients}</NumeroTotalPerceptores>

          <ImporteTotalAnual>
            <BaseTotal>${this.formatNumber(data.totalBase)}</BaseTotal>
            <RetencionesTotal>${this.formatNumber(data.totalRetained)}</RetencionesTotal>
          </ImporteTotalAnual>

          <DetallePerceptoresAnual>
            ${data.recipients.map(recipient => `
            <PerceptorAnual>
              <Identificacion>
                <NIF>${this.escapeXml(recipient.nif)}</NIF>
                <NombreRazon>${this.escapeXml(recipient.name)}</NombreRazon>
                ${recipient.address ? `<Domicilio>${this.escapeXml(recipient.address)}</Domicilio>` : ''}
              </Identificacion>
              <TotalesAnuales>
                <BaseAnual>${this.formatNumber(recipient.totalBase)}</BaseAnual>
                <RetencionAnual>${this.formatNumber(recipient.totalRetained)}</RetencionAnual>
              </TotalesAnuales>
              <DetalleTrimestral>
                ${recipient.quarterlyDetail.map(quarter => `
                <Trimestre>
                  <Base>${this.formatNumber(quarter.base)}</Base>
                  <Retencion>${this.formatNumber(quarter.amount)}</Retencion>
                </Trimestre>
                `).join('')}
              </DetalleTrimestral>
            </PerceptorAnual>
            `).join('')}
          </DetallePerceptoresAnual>
        </ResumenAnual>
      </RegistroModelo190>
    </SuministroResumenAnual>
  </soap:Body>
</soap:Envelope>`;

    return this.formatXML(xml);
  }

  /**
   * Genera XML para Modelo 347 - Operaciones con terceros
   */
  static generateModel347XML(data: Model347DataDto): string {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:soapenc="http://schemas.xmlsoap.org/soap/encoding/"
               xmlns:xsd="http://www.w3.org/2001/XMLSchema"
               xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <soap:Body>
    <SuministroOperacionesTerceros xmlns="https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/burt/jdit/ws/SuministroOperacionesTerceros.xsd">
      <Cabecera>
        <IDVersionSii>1.1</IDVersionSii>
        <Titular>
          <NIF>${this.escapeXml(data.nif)}</NIF>
          <NombreRazon>${this.escapeXml(data.companyName)}</NombreRazon>
        </Titular>
        <TipoComunicacion>A0</TipoComunicacion>
      </Cabecera>
      <RegistroModelo347>
        <Ejercicio>${data.fiscalYear}</Ejercicio>
        <DeclaracionOperaciones>
          ${data.isComplementary ? '<TipoDeclaracion>C</TipoDeclaracion>' : ''}

          <NumeroTerceros>${data.numberOfThirdParties}</NumeroTerceros>
          <ImporteTotalDeclarado>${this.formatNumber(data.totalAmount)}</ImporteTotalDeclarado>

          <DetalleOperacionesTerceros>
            ${data.operations.map(op => `
            <OperacionTercero>
              <Identificacion>
                <NIF>${this.escapeXml(op.nif)}</NIF>
                <NombreRazon>${this.escapeXml(op.name)}</NombreRazon>
              </Identificacion>
              <Operaciones>
                ${op.purchaseAmount > 0 ? `
                <Compras>
                  <ImporteCompras>${this.formatNumber(op.purchaseAmount)}</ImporteCompras>
                </Compras>
                ` : ''}
                ${op.salesAmount > 0 ? `
                <Ventas>
                  <ImporteVentas>${this.formatNumber(op.salesAmount)}</ImporteVentas>
                </Ventas>
                ` : ''}
                <ImporteTotal>${this.formatNumber(op.totalAmount)}</ImporteTotal>
                <NumeroFacturas>${op.invoiceCount}</NumeroFacturas>
              </Operaciones>
            </OperacionTercero>
            `).join('')}
          </DetalleOperacionesTerceros>
        </DeclaracionOperaciones>
      </RegistroModelo347>
    </SuministroOperacionesTerceros>
  </soap:Body>
</soap:Envelope>`;

    return this.formatXML(xml);
  }

  /**
   * Genera XML para SII - Facturas Emitidas
   */
  static generateSIIIssuedInvoicesXML(
    companyNif: string,
    companyName: string,
    invoices: any[],
  ): string {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:siiR="https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/ssii/fact/ws/SuministroInformacion.xsd">
  <soapenv:Header/>
  <soapenv:Body>
    <siiR:SuministroLRFacturasEmitidas>
      <siiR:Cabecera>
        <siiR:IDVersionSii>1.1</siiR:IDVersionSii>
        <siiR:Titular>
          <siiR:NIF>${this.escapeXml(companyNif)}</siiR:NIF>
          <siiR:NombreRazon>${this.escapeXml(companyName)}</siiR:NombreRazon>
        </siiR:Titular>
        <siiR:TipoComunicacion>A0</siiR:TipoComunicacion>
      </siiR:Cabecera>
      <siiR:RegistroLRFacturasEmitidas>
        ${invoices.map(invoice => `
        <siiR:RegistroLRFactura>
          <siiR:PeriodoLiquidacion>
            <siiR:Ejercicio>${new Date(invoice.invoiceDate).getFullYear()}</siiR:Ejercicio>
            <siiR:Periodo>${this.getPeriodFromDate(new Date(invoice.invoiceDate))}</siiR:Periodo>
          </siiR:PeriodoLiquidacion>
          <siiR:IDFactura>
            <siiR:IDEmisorFactura>
              <siiR:NIF>${this.escapeXml(companyNif)}</siiR:NIF>
            </siiR:IDEmisorFactura>
            <siiR:NumSerieFacturaEmisor>${this.escapeXml(invoice.invoiceNumber)}</siiR:NumSerieFacturaEmisor>
            <siiR:FechaExpedicionFacturaEmisor>${this.formatDate(invoice.invoiceDate)}</siiR:FechaExpedicionFacturaEmisor>
          </siiR:IDFactura>
          <siiR:FacturaExpedida>
            <siiR:TipoFactura>${this.escapeXml(invoice.operationType)}</siiR:TipoFactura>
            <siiR:ClaveRegimenEspecialOTrascendencia>01</siiR:ClaveRegimenEspecialOTrascendencia>
            <siiR:DescripcionOperacion>${this.escapeXml(invoice.description || 'Operación habitual')}</siiR:DescripcionOperacion>
            <siiR:Contraparte>
              <siiR:NIF>${this.escapeXml(invoice.thirdPartyNif)}</siiR:NIF>
              <siiR:NombreRazon>${this.escapeXml(invoice.thirdPartyName)}</siiR:NombreRazon>
            </siiR:Contraparte>
            <siiR:TipoDesglose>
              <siiR:DesgloseFactura>
                <siiR:Sujeta>
                  <siiR:NoExenta>
                    <siiR:TipoNoExenta>S1</siiR:TipoNoExenta>
                    <siiR:DesgloseIVA>
                      <siiR:DetalleIVA>
                        <siiR:TipoImpositivo>${this.formatNumber(invoice.ivaPercentage)}</siiR:TipoImpositivo>
                        <siiR:BaseImponible>${this.formatNumber(invoice.baseAmount)}</siiR:BaseImponible>
                        <siiR:CuotaRepercutida>${this.formatNumber(invoice.ivaAmount)}</siiR:CuotaRepercutida>
                      </siiR:DetalleIVA>
                    </siiR:DesgloseIVA>
                  </siiR:NoExenta>
                </siiR:Sujeta>
              </siiR:DesgloseFactura>
            </siiR:TipoDesglose>
            <siiR:ImporteTotal>${this.formatNumber(invoice.totalAmount)}</siiR:ImporteTotal>
          </siiR:FacturaExpedida>
        </siiR:RegistroLRFactura>
        `).join('')}
      </siiR:RegistroLRFacturasEmitidas>
    </siiR:SuministroLRFacturasEmitidas>
  </soapenv:Body>
</soapenv:Envelope>`;

    return this.formatXML(xml);
  }

  /**
   * Genera XML para SII - Facturas Recibidas
   */
  static generateSIIReceivedInvoicesXML(
    companyNif: string,
    companyName: string,
    invoices: any[],
  ): string {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:siiR="https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/ssii/fact/ws/SuministroInformacion.xsd">
  <soapenv:Header/>
  <soapenv:Body>
    <siiR:SuministroLRFacturasRecibidas>
      <siiR:Cabecera>
        <siiR:IDVersionSii>1.1</siiR:IDVersionSii>
        <siiR:Titular>
          <siiR:NIF>${this.escapeXml(companyNif)}</siiR:NIF>
          <siiR:NombreRazon>${this.escapeXml(companyName)}</siiR:NombreRazon>
        </siiR:Titular>
        <siiR:TipoComunicacion>A0</siiR:TipoComunicacion>
      </siiR:Cabecera>
      <siiR:RegistroLRFacturasRecibidas>
        ${invoices.map(invoice => `
        <siiR:RegistroLRFactura>
          <siiR:PeriodoLiquidacion>
            <siiR:Ejercicio>${new Date(invoice.invoiceDate).getFullYear()}</siiR:Ejercicio>
            <siiR:Periodo>${this.getPeriodFromDate(new Date(invoice.invoiceDate))}</siiR:Periodo>
          </siiR:PeriodoLiquidacion>
          <siiR:IDFactura>
            <siiR:IDEmisorFactura>
              <siiR:NIF>${this.escapeXml(invoice.thirdPartyNif)}</siiR:NIF>
            </siiR:IDEmisorFactura>
            <siiR:NumSerieFacturaEmisor>${this.escapeXml(invoice.invoiceNumber)}</siiR:NumSerieFacturaEmisor>
            <siiR:FechaExpedicionFacturaEmisor>${this.formatDate(invoice.invoiceDate)}</siiR:FechaExpedicionFacturaEmisor>
          </siiR:IDFactura>
          <siiR:FacturaRecibida>
            <siiR:TipoFactura>${this.escapeXml(invoice.operationType)}</siiR:TipoFactura>
            <siiR:ClaveRegimenEspecialOTrascendencia>01</siiR:ClaveRegimenEspecialOTrascendencia>
            <siiR:DescripcionOperacion>${this.escapeXml(invoice.description || 'Operación habitual')}</siiR:DescripcionOperacion>
            <siiR:DesgloseFactura>
              <siiR:DesgloseIVA>
                <siiR:DetalleIVA>
                  <siiR:TipoImpositivo>${this.formatNumber(invoice.ivaPercentage)}</siiR:TipoImpositivo>
                  <siiR:BaseImponible>${this.formatNumber(invoice.baseAmount)}</siiR:BaseImponible>
                  <siiR:CuotaSoportada>${this.formatNumber(invoice.ivaAmount)}</siiR:CuotaSoportada>
                  <siiR:PorcentCompensacionREAGYP>0</siiR:PorcentCompensacionREAGYP>
                </siiR:DetalleIVA>
              </siiR:DesgloseIVA>
            </siiR:DesgloseFactura>
            <siiR:Contraparte>
              <siiR:NIF>${this.escapeXml(invoice.thirdPartyNif)}</siiR:NIF>
              <siiR:NombreRazon>${this.escapeXml(invoice.thirdPartyName)}</siiR:NombreRazon>
            </siiR:Contraparte>
            <siiR:FechaRegContable>${this.formatDate(invoice.invoiceDate)}</siiR:FechaRegContable>
            <siiR:CuotaDeducible>${this.formatNumber(invoice.ivaAmount)}</siiR:CuotaDeducible>
          </siiR:FacturaRecibida>
        </siiR:RegistroLRFactura>
        `).join('')}
      </siiR:RegistroLRFacturasRecibidas>
    </siiR:SuministroLRFacturasRecibidas>
  </soapenv:Body>
</soapenv:Envelope>`;

    return this.formatXML(xml);
  }

  /**
   * Escapa caracteres especiales XML
   */
  private static escapeXml(unsafe: string): string {
    if (!unsafe) return '';
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Formatea número para XML (2 decimales)
   */
  private static formatNumber(num: number): string {
    return num.toFixed(2);
  }

  /**
   * Formatea fecha para XML (DD-MM-YYYY)
   */
  private static formatDate(date: Date | string): string {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  /**
   * Obtiene periodo trimestral desde fecha
   */
  private static getPeriodFromDate(date: Date): string {
    const month = date.getMonth() + 1;
    if (month <= 3) return '1T';
    if (month <= 6) return '2T';
    if (month <= 9) return '3T';
    return '4T';
  }

  /**
   * Formatea XML con indentación
   */
  private static formatXML(xml: string): string {
    // Eliminar espacios en blanco innecesarios
    xml = xml.replace(/>\s+</g, '><');

    // Retornar sin formateo adicional (la firma XMLDSig requiere formato exacto)
    return xml.trim();
  }
}
