import { useState, useEffect } from 'react';
import { icpstore_backend } from 'declarations/icpstore_backend';

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState("");

  const ledgerCanisterId = process.env.CANISTER_ID_ICPSC_ICRC1_LEDGER_CANISTER;
  const backendCanisterId = process.env.CANISTER_ID_ICPSTORE_BACKEND;

  useEffect(() => {
    const init = async () => {
      const productList = await icpstore_backend.getProducts();
      setProducts(productList);
    }
    init();
  }, []);

  const handleBuy = async (product) => {
    setLoading(`Processando compra de "${product.title}"...`);

    const isConnected = await window.ic.plug.isConnected();
    if (!isConnected) {
      await window.ic.plug.requestConnect({
        whitelist: [ledgerCanisterId, backendCanisterId],
      });
    }

    const amountInE8s = product.price * 100_000_000n;

    const transferParams = {
      to: backendCanisterId,
      amount: Number(amountInE8s),
      symbol: "ICPSC",
      standard: "ICRC-1",
      canisterId: ledgerCanisterId,
      fee: 10_000n,
      memo: BigInt(product.id),
      from_subaccount: [], 
      created_at_time: [],
    };

    try {
      const result = await window.ic.plug.requestTransfer(transferParams);
      console.log('Resultado da transferência:', result);
      setLoading("Transferência confirmada! Finalizando compra...");

      const buyResult = await icpstore_backend.buyProduct(product.id);
      alert(buyResult);

    } catch (error) {
      console.error("Erro na compra:", error);
      alert("A compra falhou. Por favor, tente novamente.");
    } finally {
      setLoading("");
    }
  };

  return (
    <div className="container">
      <h1 className="titulo">Loja de Cursos da ICP</h1>
      
      {loading && <p className="loading-message">{loading}</p>}
      
      <div className="grade-cursos">
        {products.map((p) => (
          <div key={Number(p.id)} className="card">
            <img src={p.image} alt={p.title} className="imagem" />
            <h2 className="card-titulo">{p.title}</h2>
            <p className="descricao">{p.description}</p>
            <p className="preco">{p.price.toString()} ICPSC</p>
            <button className="botao" onClick={() => handleBuy(p)} disabled={loading}>
              Comprar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;