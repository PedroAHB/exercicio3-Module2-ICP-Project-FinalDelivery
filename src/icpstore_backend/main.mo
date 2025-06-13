import Array "mo:base/Array";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";

shared(msg) actor class() {

  type Product = {
    id: Nat;
    title: Text;
    description: Text;
    price: Nat;
    image: Text;
  };

  stable var products: [Product] = [
    { id = 0; title = "Motoko para Iniciantes"; description = "Aprenda os fundamentos da linguagem Motoko e como criar DApps na ICP."; price = 50; image = "motoko.jpeg"},
    { id = 1; title = "Tokens ICRC-1 e ICRC-2"; description = "Descubra como criar e gerenciar tokens na Internet Computer."; price = 70; image = "tokens.jpeg"},
    { id = 2; title = "Front-end com React na ICP"; description = "Construa interfaces modernas para DApps usando React na ICP."; price = 20; image = "frontend.jpeg"},
    { id = 3; title = "Chain Fusion na Prática"; description = "Entenda o o que é o projeto Chain Fusion e como utilizar ele na ICP."; price = 100; image = "chain_fusion.jpeg"},
    { id = 4; title = "Dominando HTTPS Outcalls"; description = "Aprenda a realizar chamadas HTTPS para serviços externos a partir da blockchain da ICP."; price = 60; image = "http.jpeg"},
    { id = 5; title = "NFTs na ICP"; description = "Aprenda como criar, mintar e vender NFTs usando a Internet Computer."; price = 100; image = "nft.jpeg"}
  ];

  stable var purchases: [(Principal, Nat)] = [];
  
  private func findProductById(id: Nat) : ?Product {
    for (p in products.vals()) {
      if (p.id == id) {
        return ?p;
      };
    };
    return null;
  };

  public query func getProducts() : async [Product] {
    return products;
  };

  public func buyProduct(productId: Nat) : async Text {
    let caller = msg.caller;
    
    if (findProductById(productId) == null) {
        return "Erro: Produto não encontrado.";
    };
    
    purchases := Array.append(purchases, [(caller, productId)]);

    return "Compra realizada com sucesso!";
  };

  public query func getMyPurchasedProducts() : async [Product] {
    let caller = msg.caller;
    var my_products: [Product] = [];

    for ((p, id) in purchases.vals()) {
        if (Principal.equal(p, caller)) {
            switch(findProductById(id)) {
                case (?product) {
                    my_products := Array.append(my_products, [product]);
                };
                case null {};
            }
        }
    };
    return my_products;
  };
};