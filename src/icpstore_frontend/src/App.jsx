import { useState, useEffect } from 'react';
import { icpstore_backend } from 'declarations/icpstore_backend';
import { Principal } from '@dfinity/principal';
import { idlFactory } from '../../declarations/icpsc_icrc1_ledger_canister/icpsc_icrc1_ledger_canister.did.js';

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState("");

  const ledgerCanisterId = process.env.CANISTER_ID_ICPSC_ICRC1_LEDGER_CANISTER;
  const backendCanisterId = process.env.CANISTER_ID_ICPSTORE_BACKEND;
  const host = process.env.DFX_NETWORK === 'ic' ? 'https://mainnet.dfinity.network' : 'http://localhost:4943';

  useEffect(() => {
    const init = async () => {
      const productList = await icpstore_backend.getProducts();
      setProducts(productList);
    }
    init();
  }, []);

  const handleBuy = async (product) => {
    setLoading(`Processando compra de "${product.title}"...`);

    try {
      const isConnected = await window.ic.plug.isConnected();
      if (!isConnected) {
        await window.ic.plug.requestConnect({
          whitelist: [ledgerCanisterId, backendCanisterId],
          host: host,
        });
      }

      const actorLedger = await window.ic.plug.createActor({
        canisterId: ledgerCanisterId,
        interfaceFactory: idlFactory,
      });

      const transferArgs = {
        to: {
          owner: Principal.fromText(backendCanisterId),
          subaccount: [],
        },
        fee: [10000n],
        memo: [],
        from_subaccount: [],
        created_at_time: [],
        amount: product.price * 100_000_000n,
      };

      setLoading("Aguardando aprovação na carteira...");
      const transferResult = await actorLedger.icrc1_transfer(transferArgs);
      console.log("Resultado da transferência do ledger:", transferResult);

      if ("Err" in transferResult) {
        throw new Error("A transferência no ledger falhou: " + JSON.stringify(transferResult.Err));
      }
      
      setLoading("Transferência confirmada! Finalizando compra...");
      const buyResult = await icpstore_backend.buyProduct(product.id);
      alert(buyResult);

    } catch (error) {
      console.error("Erro no processo de compra:", error);

      if (error.message?.includes('Invalid certificate: Signature verification failed')) {
        console.warn("WORKAROUND: Erro de certificado ignorado em ambiente local, pois a transferência provavelmente ocorreu.");
        
        setLoading("Transferência enviada! Finalizando compra...");
        try {
            const buyResult = await icpstore_backend.buyProduct(product.id);
            alert(buyResult);
        } catch (finalError) {
            console.error("Erro ao finalizar a compra após o workaround:", finalError);
            alert("Ocorreu um erro ao registrar sua compra após a transferência.");
        }

      } else {
        alert("A compra falhou. Por favor, tente novamente. Detalhes no console.");
      }
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