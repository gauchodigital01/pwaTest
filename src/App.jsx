import { useEffect, useState } from "react";
import * as Icon from "./icons.jsx";



const hoy = new Date().toISOString().split("T")[0];



export default function App() {
          const [topValue, setTopValue] = useState('');
          const [bottomValue, setBottomValue] = useState('')
          const [viajes, setViajes] = useState([]);
          const [gastos, setGastos] = useState([]);
          const [vista, setVista] = useState('agregar');
          const [viaje, setViaje] = useState({ diaCarga: hoy, origen: '', destino: '', toneladas: '', nroCartaPorte: '', tarifa: '', factura: '' });
          const [gasto, setGasto] = useState({ fecha: hoy, monto: '', descripcion: 'Combustible' });
          const [tutorial, setTutorial] = useState(false);
          const [msg, setMsg] = useState('');
          const [err, setErr] = useState({});
          const [busqueda, setBusqueda] = useState('');

          useEffect(() => { 
            (async () => {
              try {
                const v = await window.storage.get('viajes');
                if (v?.value) setViajes(JSON.parse(v.value));
                const g = await window.storage.get('gastos');
                if (g?.value) setGastos(JSON.parse(g.value));
              } catch (e) {}
              if (!localStorage.getItem('tut') && viajes.length === 0) setTutorial(true);
            })();
          }, []);

          const guardarV = async (nv) => { try { await window.storage.set('viajes', JSON.stringify(nv)); } catch (e) {} };
          const guardarG = async (ng) => { try { await window.storage.set('gastos', JSON.stringify(ng)); } catch (e) {} };
          
          const mostrarMsg = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

          const handleTopChange = (e) => {
            const value = e.target.value;
            setTopValue(value);
            if (value === '') {
              setBottomValue('');
            } else {
              const num = parseFloat(value);
              if (!isNaN(num)) {
                setBottomValue((num * 0.21).toFixed(2));
              }
            }
          };

          const handleBottomChange = (e) => {
            const value = e.target.value;
            setBottomValue(value);
            if (value === '') {
              setTopValue('');
            } else {
              const num = parseFloat(value);
              if (!isNaN(num)) {
                setTopValue((num / 0.21).toFixed(2));
              }
            }
          };

          const exportarViajesJSON = () => {
            const data = JSON.stringify(viajes, null, 2); // formatea bonito
            const blob = new Blob([data], { type: "application/json" });
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = "viajes.json";
            a.click();

            URL.revokeObjectURL(url);
          };
          const importarViajesJSON = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();

            reader.onload = (ev) => {
              try {
                const data = JSON.parse(ev.target.result);

                // Validación mínima
                if (!Array.isArray(data)) {
                  alert("El archivo no es válido");
                  return;
                }

                setViajes(data);
                guardarV(data);
                mostrarMsg("✓ Viajes importados");
              } catch {
                alert("Error leyendo el archivo");
              }
            };

            reader.readAsText(file);
          };

          const exportarViajesPDF = () => {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF("p", "mm", "a4");

            // Título
            doc.setFontSize(16);
            doc.text("Gestor de Viajes", 14, 15);

            doc.setFontSize(10);
            doc.text(`Fecha de exportación: ${new Date().toLocaleDateString("es-AR")}`, 14, 22);

            // Tabla
            doc.autoTable({
              startY: 30,
              head: [[
                "Fecha",
                "Origen",
                "Destino",
                "Toneladas",
                "Tarifa",
                "Subtotal",
                "IVA",
                "Total"
              ]],
              body: viajes.map(v => {
                const t = parseFloat(v.toneladas) || 0;
                const r = parseFloat(v.tarifa) || 0;
                const sub = t * r;
                const iva = sub * 0.21;
                const tot = sub * 1.21;

                return [
                  new Date(v.diaCarga).toLocaleDateString("es-AR"),
                  v.origen,
                  v.destino,
                  t || "",
                  r ? `$${r}` : "",
                  `$${sub.toLocaleString("es-AR")}`,
                  `$${iva.toLocaleString("es-AR")}`,
                  `$${tot.toLocaleString("es-AR")}`
                ];
              }),
              styles: {
                fontSize: 8,
                cellPadding: 2
              },
              headStyles: {
                fillColor: [30, 64, 175], // azul
                textColor: 255
              },
              columnStyles: {
                3: { halign: "right" },
                4: { halign: "right" },
                5: { halign: "right" },
                6: { halign: "right" },
                7: { halign: "right" }
              }
            });

            // Totales
            const y = doc.lastAutoTable.finalY + 10;

            doc.setFontSize(11);
            doc.text("Totales", 14, y);

            doc.setFontSize(10);
            doc.text(`Subtotal: $${totV.s.toLocaleString("es-AR")}`, 14, y + 6);
            doc.text(`IVA Débito: $${totV.i.toLocaleString("es-AR")}`, 14, y + 12);
            doc.text(`IVA Crédito: $${ivaG.toLocaleString("es-AR")}`, 14, y + 18);
            doc.text(`IVA a pagar: $${(ivaN * -1).toLocaleString("es-AR")}`, 14, y + 24);
            doc.text(`Total con IVA: $${totV.t.toLocaleString("es-AR")}`, 14, y + 30);

            doc.save("viajes.pdf");
          };



          const addViaje = () => {
            const e = {};
            if (!viaje.diaCarga) e.diaCarga = 1;
            if (!viaje.origen) e.origen = 1;
            if (!viaje.destino) e.destino = 1;
            setErr(e);
            if (Object.keys(e).length > 0) { alert('⚠️ Completa los campos en rojo'); return; }
            const nv = [...viajes, { ...viaje, id: Date.now() }];
            setViajes(nv);
            guardarV(nv);
            setViaje({ diaCarga: hoy, origen: '', destino: '', toneladas: '', nroCartaPorte: '', tarifa: '', factura: '' });
            mostrarMsg('✓ Viaje agregado');
            setErr({});
          };

          const addGasto = () => {
            const e = {};
            if (!gasto.fecha) e.fecha = 1;
            if (!gasto.monto) e.monto = 1;
            setErr(e);
            if (Object.keys(e).length > 0) { alert('⚠️ Completa los campos en rojo'); return; }
            const ng = [...gastos, { ...gasto, id: Date.now() }];
            setGastos(ng);
            guardarG(ng);
            setGasto({ fecha: hoy, monto: '', descripcion: 'Combustible' });
            mostrarMsg('✓ Gasto agregado');
            setErr({});
          };

          const delViaje = (id, v) => {
            if (confirm(`¿Eliminar ${v.origen} → ${v.destino}?`)) {
              const nv = viajes.filter(x => x.id !== id);
              setViajes(nv);
              guardarV(nv);
              mostrarMsg('✓ Eliminado');
            }
          };

          const delGasto = (id, g) => {
            if (confirm(`¿Eliminar gasto $${g.monto}?`)) {
              const ng = gastos.filter(x => x.id !== id);
              setGastos(ng);
              guardarG(ng);
              mostrarMsg('✓ Eliminado');
            }
          };

          const totV = viajes.reduce((a, v) => {
            const t = parseFloat(v.toneladas) || 0;
            const r = parseFloat(v.tarifa) || 0;
            const s = t * r;
            a.s += s;
            a.i += s * 0.21;
            a.t += s * 1.21;
            return a;
          }, { s: 0, i: 0, t: 0 });

          const totG = gastos.reduce((a, g) => a + (parseFloat(g.monto) || 0), 0);
          const ivaG = gastos.reduce((a, g) => a + ((parseFloat(g.monto) || 0) * 0.21), 0);
          const ivaN = totV.i - ivaG;

          const viajesFiltrados = viajes.filter(v => {
            const termino = busqueda.toLowerCase();
            return v.origen.toLowerCase().includes(termino) || 
                   v.destino.toLowerCase().includes(termino) ||
                   (v.nroCartaPorte && v.nroCartaPorte.toLowerCase().includes(termino)) ||
                   (v.factura && v.factura.toLowerCase().includes(termino)) ||
                   new Date(v.diaCarga).toLocaleDateString('es-AR').includes(termino);
          });
          

          return (
            
            <div className="min-h-screen bg-gray-50">
              {tutorial && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white p-6 max-w-md border">
                    <h2 className="text-lg font-medium mb-4">👋 Bienvenido</h2>
                    <div className="space-y-2 text-sm text-gray-600 mb-6">
                      <p><strong>Viaje:</strong> Fecha, origen y destino son obligatorios (*). Lo demás es opcional.</p>
                      <p><strong>Gastos:</strong> Solo fecha y monto son obligatorios.</p>
                      <p><strong>Datos:</strong> Revisa todo. El IVA se calcula automáticamente.</p>
                    </div>
                    <button onClick={() => { setTutorial(false); localStorage.setItem('tut', '1'); }} 
                      className="w-full px-6 py-2 text-sm font-medium bg-gray-900 text-white hover:bg-gray-800">
                      Entendido
                    </button>
                  </div>
                </div>
              )}

              {msg && (
                <div className="fixed top-4 right-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 text-sm z-50">
                  {msg}
                </div>
              )}
              <div className="fixed bottom-3 left-1/2 -translate-x-1/2 inline-flex rounded-lg shadow-sm">
                  <button
                      onClick={() => setVista('agregar')}
                      className={`px-4 py-2 flex items-center gap-2 justify-center border text border-green-900 text-slate-900 rounded-l-lg transition-colors ${
                        vista === 'agregar'
                          ? 'bg-green-200 text-white-900'
                          : 'bg-slate-100 text-gray-700'
                      }`}
                    ><Icon.Plus className="text-green-900"/><span className="font-bold">Viajes</span></button>
                    <button
                      onClick={() => setVista('gastos')}
                      className={`px-4 py-2 flex items-center gap-2 justify-center border border-green-900 text-slate-900 transition-colors ${
                        vista === 'gastos'
                          ? 'bg-green-200 text-green'
                          : 'bg-slate-100 text-gray-700'
                      }`}
                    >
                      <Icon.DollarSign className="text-green-900"/><span className="font-bold">Gastos</span>
                    </button>
                    <button
                      onClick={() => setVista('datos')}
                      className={`px-4 py-2 flex items-center gap-2 justify-center border border-green-900 text-slate-900 rounded-r-lg transition-colors ${
                        vista === 'datos'
                          ? 'bg-green-200 text-green'
                          : 'bg-slate-100 text-black-700'
                      }`}
                    >
                      <Icon.Menu className="text-green-900"/><span className="font-bold"> Datos</span>
                    </button>
                </div>
              
                <header className="h-14 bg-gradient-to-r from-green-700 to-green-800 flex items-center px-4 shadow-md">
                  <h1 className="text-xl font-bold flex items-center gap-2 text-white">
                    <Icon.Truck className="w-8 h-8 -skew-x-6" />
                    Gestor de Viajes
                  </h1>
                  <div className="flex-1" />
                  <button
                    className="p-2 rounded-full hover:bg-white/20 transition-colors"
                    aria-label="User menu"
                  ><Icon.User className="w-7 h-7 text-white"/></button>
                </header>

                <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-green-900 p-4">
                <div className="max-w-7xl mx-auto">
                  

                {vista === 'agregar' && (
                  <div className="max-w-7xl mx-auto">
                     <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                      <h2 className="text-xl font-bold text-gray-800 mb-4 flex gap-2">
                        <Icon.Calculator/>Calculadora IVA
                      </h2>
        
                      <div className="space-y-6">
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-700">$</span>
                          <input
                            type="number"
                            value={topValue}
                            onChange={handleTopChange}
                            placeholder="0.00"
                            className="w-full pl-8 pr-4 py-2 placeholder-gray-700 border border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div className="flex justify-center">
                          <div className="text-gray-400">×21%</div>
                        </div>

                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-700">$</span>
                          <input
                            type="number"
                            value={bottomValue}
                            onChange={handleBottomChange}
                            placeholder="0.00"
                            className="w-full pl-8 pr-4 py-2 placeholder-gray-700 border border-gray-500 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  
                  <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <Icon.Plus/>Nuevo Viaje
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                      <div>
                        <input type="date" value={viaje.diaCarga} onChange={e => { setViaje({...viaje, diaCarga: e.target.value}); setErr({...err, diaCarga: 0}); }}
                          className={`w-full px-3 py-2 border border-gray-500 rounded-md bg-white text-gray-900 placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 ${err.diaCarga ? 'border-red-500' : 'border-gray-300'}`} />
                      </div>
                      <div>
                        <input type="text" value={viaje.origen} onChange={e => { setViaje({...viaje, origen: e.target.value}); setErr({...err, origen: 0}); }}
                          className={`w-full px-3 py-2 border border-gray-500 rounded-md bg-white text-gray-900 placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 ${err.origen ? 'border-red-500' : 'border-gray-300'}`} placeholder="Origen..." />
                      </div>
                      <div>
                        <input type="text" value={viaje.destino} onChange={e => { setViaje({...viaje, destino: e.target.value}); setErr({...err, destino: 0}); }}
                          className={`w-full px-3 py-2 border border-gray-500 rounded-md bg-white text-gray-900 placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 ${err.destino ? 'border-red-500' : 'border-gray-300'}`} placeholder="Destino..." />
                      </div>
                      <div>
                      <input type="number" value={viaje.toneladas} onChange={e => setViaje({...viaje, toneladas: e.target.value})} className="w-full px-3 py-2 border border-gray-500 rounded-md bg-white text-gray-900 placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600" placeholder="Toneladas..." min="0" step="0.01" />
                      </div>
                      <div>
                      <input type="number" value={viaje.tarifa} onChange={e => setViaje({...viaje, tarifa: e.target.value})} className="w-full px-3 py-2 border border-gray-500 rounded-md bg-white text-gray-900 placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600" placeholder="Tarifa..." min="0" step="0.01" />
                      </div>
                      <div>
                        <input type="text" value={viaje.nroCartaPorte} onChange={e => setViaje({...viaje, nroCartaPorte: e.target.value})} className="w-full px-3 py-2 border border-gray-500 rounded-md bg-white text-gray-900 placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600" placeholder="Carta Porte..." />
                      </div>
                      <div>
                        <input type="text" value={viaje.factura} onChange={e => setViaje({...viaje, factura: e.target.value})} className="w-full px-3 py-2 border border-gray-500 rounded-md bg-white text-gray-900 placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600" placeholder="Cuit..." />
                        </div>
                    </div>
                    {(viaje.toneladas && viaje.tarifa) && (
                      <div className="mb-4 py-3 border-t text-xs text-gray-600">
                        Total: ${((parseFloat(viaje.toneladas) || 0) * (parseFloat(viaje.tarifa) || 0)).toLocaleString("es-AR")} · 
                        IVA: ${(((parseFloat(viaje.toneladas) || 0) * (parseFloat(viaje.tarifa) || 0)) * 0.21).toLocaleString("es-AR")} · 
                        Con IVA: <span className="text-green-600 font-medium">${(((parseFloat(viaje.toneladas) || 0) * (parseFloat(viaje.tarifa) || 0)) * 1.21).toLocaleString("es-AR")}</span>
                      </div>
                    )}
                    <button 
                    onClick={addViaje} 
                    className="w-10 h-10 flex items-center justify-center bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
                    >✓
                    </button>
                  </div>
                  </div>
                )}
                

                {vista === 'gastos' && (
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <Icon.Plus/>Agregar Nuevo Gasto
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Fecha *</label>
                        <input type="date" value={gasto.fecha} onChange={e => { setGasto({...gasto, fecha: e.target.value}); setErr({...err, fecha: 0}); }}
                          className={`w-full px-3 py-2 border border-gray-500 rounded-md bg-white text-gray-900 placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 ${err.fecha ? 'border-red-500' : 'border-gray-300'}`} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Monto *</label>
                        <input type="number" value={gasto.monto} onChange={e => { setGasto({...gasto, monto: e.target.value}); setErr({...err, monto: 0}); }}
                          className={`w-full px-3 py-2 border border-gray-500 rounded-md bg-white text-gray-900 placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 ${err.monto ? 'border-red-500' : 'border-gray-300'}`} placeholder="Ej: 15000" min="0" step="0.01" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Categoría</label>
                        <select value={gasto.descripcion} onChange={e => setGasto({...gasto, descripcion: e.target.value})} 
                          className="w-full px-3 py-2 border border-gray-500 rounded-md bg-white text-gray-900 placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600">
                          <option value="Combustible">Combustible</option>
                          <option value="Mantenimiento">Mantenimiento</option>
                          <option value="Otro">Otro</option>
                        </select>
                      </div>
                    </div>
                    {gasto.monto && (
                      <div className="mb-4 py-3 border-t text-xs text-gray-600">
                        Gasto: <span className="text-red-600 font-medium">${(parseFloat(gasto.monto) || 0).toLocaleString("es-AR")}</span> · 
                        IVA Crédito: <span className="text-green-600 font-medium">${((parseFloat(gasto.monto) || 0) * 0.21).toLocaleString("es-AR")}</span>
                        <div className="mt-1 text-gray-500">💡 El IVA de gastos se resta del IVA a pagar</div>
                      </div>
                    )}
                    <button 
                    onClick={addGasto} 
                    className="w-10 h-10 flex items-center flex justify-center bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
                    >✓
                    </button>
                  </div>
                )}

                {vista === 'datos' && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-lg shadow-lg p-6">      
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="text-xxl text-green-600 font-semibold">Ganancia</div>
                      <div className="text-2xl text-gray-500">Total: ${totV.t.toLocaleString("es-AR")}</div>
                      <div className="text-2xl font-bold text-green-700">IVA: ${(totV.i).toLocaleString("es-AR")}</div>
                      <div className="text-xxl text-red-600 font-semibold">Gastos</div>
                      <div className="text-2xl  text-gray-500">Total: ${totG.toLocaleString("es-AR")}</div>
                      <div className="text-2xl font-bold text-red-700">IVA: ${(totG*0.21).toLocaleString("es-AR")}</div>
                      <div className="text-xxl text-blue-600 font-semibold">IVA Total</div>
                      <div className="text-2xl font-bold text-blue-700">${(ivaN*-1).toLocaleString("es-AR")}</div>
                    </div>   
                    </div>
                    <div className="bg-white rounded-lg shadow-lg p-6">
                      <div className="border">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-sm font-medium">Mis Viajes</h2>
                        <span className="text-xs text-gray-500">{viajesFiltrados.length} {viajesFiltrados.length === 1 ? 'viaje' : 'viajes'}</span>
                      </div>
                      {viajes.length > 0 && (
                        <div className="mb-4">
                          <input 
                            type="text" 
                            value={busqueda} 
                            onChange={e => setBusqueda(e.target.value)}
                            placeholder="Buscar por origen, destino, carta porte, factura o fecha..."
                            className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:border-gray-900"
                          />
                        </div>
                      )}
                      {viajes.length === 0 ? (
                        
                        <div className="text-center py-12">
                          <div className="text-gray-400 mb-2">📦</div>
                          <div className="text-sm text-gray-500 mb-2">No hay viajes aún</div>
                          <button onClick={() => setVista('agregar')} className="text-sm text-gray-700 hover:text-gray-900 underline">Agregar primer viaje</button>
                        </div>
                      ) : viajesFiltrados.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="text-gray-400 mb-2">🔍</div>
                          <div className="text-sm text-gray-500 mb-2">No se encontraron viajes</div>
                          <button onClick={() => setBusqueda('')} className="text-sm text-gray-700 hover:text-gray-900 underline">Limpiar búsqueda</button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {viajesFiltrados.sort((a, b) => new Date(b.diaCarga) - new Date(a.diaCarga)).map(v => (
                            <div key={v.id} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">{v.origen} → {v.destino}</div>
                                <div className="text-xs text-gray-500">{new Date(v.diaCarga).toLocaleDateString('es-AR')}{v.toneladas && ` · ${v.toneladas}t`}{v.tarifa && ` · $${v.tarifa}/t`}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-green-600">${((parseFloat(v.toneladas) || 0) * (parseFloat(v.tarifa) || 0)).toLocaleString("es-AR")}</div>
                                <div className="text-xs text-gray-500">{v.factura || v.nroCartaPorte || '—'}</div>
                              </div>
                              <button onClick={() => delViaje(v.id, v)} className="text-gray-400 hover:text-red-600 text-xs ml-2 px-2">✕</button>
                            </div>
                          ))}
                        </div>
                      )}
                      </div>

                      <div className="border">
                      <div className="flex justify-between mb-4">
                        <h2 className="text-sm font-medium">Mis Gastos</h2>
                        <span className="text-xs text-gray-500">{gastos.length} {gastos.length === 1 ? 'gasto' : 'gastos'}</span>
                      </div>
                      {gastos.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="text-gray-400 mb-2">💰</div>
                          <div className="text-sm text-gray-500 mb-2">No hay gastos aún</div>
                          <button onClick={() => {setVista('gastos'); window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });}}  className="text-sm text-gray-700 hover:text-gray-900 underline">Agregar primer gasto</button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {gastos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).map(g => (
                            <div key={g.id} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">{g.descripcion || 'Sin descripción'}</div>
                                <div className="text-xs text-gray-500">{new Date(g.fecha).toLocaleDateString('es-AR')}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-red-600">${parseFloat(g.monto).toLocaleString("es-AR")}</div>
                                <div className="text-xs text-gray-500">IVA: ${(parseFloat(g.monto) * 0.21).toLocaleString("es-AR")}</div>
                              </div>
                              <button onClick={() => delGasto(g.id, g)} className="text-gray-400 hover:text-red-600 text-xs ml-2 px-2">✕</button>
                            </div>
                          ))}
                        </div>

                      )}
                      </div>
                     <div className="inline-flex rounded-lg shadow-sm">

                                {/* Botón Exportar PDF */}
                          <button
                            onClick={exportarViajesPDF}
                            className="px-4 py-2 bg-white border-t border-b border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            Imprimir PDF
                          </button>

                          <button
                            onClick={exportarViajesJSON}
                            className="px-4 py-2 bg-white border-t border-b border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Guardar Viajes
                          </button>

                          {/* Input de Importación con estilo de botón 
                          <label className="inline-flex items-center gap-2 px-4 py-2 cursor-pointer bg-white border-t border-b border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors">

                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Importar Viajes
                            <input
                              type="file"
                              accept="application/json"
                              onChange={importarViajesJSON}
                              className="hidden"
                            />
                          </label>*/}

                          
                        </div>
                    </div>
                  </div>
                )}
              </div>
              
            </div>
            </div>
            
          );
          
        }

