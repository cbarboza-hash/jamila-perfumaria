// LINK DO SEU GOOGLE APPS SCRIPT (Cole aqui a URL que você copiou no passo de implantação)
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbx0u4QmQoU3Z0o3SEDIZNcfM0wD2S4jpLvoaEUIayIkLuSHi1rncjUtWlFcwJx6DQQ/exec";

let produtosDoEstoque = [];
let carrinho = [];

// Mapeando elementos do HTML
const gridProdutos = document.getElementById("grid-produtos");
const containerCarrinho = document.getElementById("itens-carrinho");
const txtSubtotal = document.getElementById("valor-subtotal");
const txtDesconto = document.getElementById("valor-desconto");
const txtTotal = document.getElementById("valor-total");
const inputDescontoExtra = document.getElementById("desconto-extra");
const opcoesPagamento = document.querySelectorAll('input[name="forma-pagto"]');

// FUNÇÃO PARA BUSCAR PRODUTOS DA PLANILHA DO GOOGLE
async function carregarProdutosDaPlanilha() {
    try {
        const resposta = await fetch(WEB_APP_URL);
        produtosDoEstoque = await resposta.json();
        renderizarProdutos();
    } catch (erro) {
        gridProdutos.innerHTML = `<p style="color:red; padding:20px;">Erro ao carregar produtos: ${erro}</p>`;
    }
}

// FUNÇÃO PARA DESENHAR OS CARDS DE PRODUTOS DINAMICAMENTE
function renderizarProdutos() {
    gridProdutos.innerHTML = "";
    
    produtosDoEstoque.forEach(produto => {
        const card = document.createElement("div");
        card.classList.add("produto-card");
        
        // Verifica se tem promoção cadastrada na planilha para exibir as tags de desconto
        let blocoPreco = `<p class="preco-atual">R$ ${produto.preco.toFixed(2).replace('.', ',')}</p>`;
        let tagPromo = "";
        
        if (produto.promocao > 0) {
            tagPromo = `<div class="badge-promo">-${produto.promocao}%</div>`;
            blocoPreco = `
                <p class="preco-original">R$ ${produto.precoOriginal.toFixed(2).replace('.', ',')}</p>
                <p class="preco-atual">R$ ${produto.preco.toFixed(2).replace('.', ',')}</p>
            `;
        }

        card.innerHTML = `
            ${tagPromo}
            <h3>${produto.nome}</h3>
            ${blocoPreco}
            <p class="estoque">Estoque: ${produto.estoque} un</p>
            <button class="btn-adicionar" onclick="adicionarAoCarrinho(${produto.id})">Adicionar ao Carrinho</button>
        `;
        gridProdutos.appendChild(card);
    });
}

// FUNÇÃO ADICIONAR AO CARRINHO
function adicionarAoCarrinho(idProduto) {
    const produto = produtosDoEstoque.find(p => p.id === idProduto);
    const itemJaNoCarrinho = carrinho.find(item => item.id === idProduto);

    // Validação básica de estoque imposta pela planilha
    const qtdAtualNoCarrinho = itemJaNoCarrinho ? itemJaNoCarrinho.quantidade : 0;
    if (qtdAtualNoCarrinho >= produto.estoque) {
        alert("Quantidade indisponível no estoque!");
        return;
    }

    if (itemJaNoCarrinho) {
        itemJaNoCarrinho.quantidade += 1;
    } else {
        carrinho.push({
            id: produto.id,
            nome: produto.nome,
            preco: produto.preco,
            quantidade: 1
        });
    }

    atualizarInterfaceDoCaixa();
}

// ATUALIZAR INTERFACE DO CAIXA
function atualizarInterfaceDoCaixa() {
    containerCarrinho.innerHTML = "";
    let subtotal = 0;

    if (carrinho.length === 0) {
        containerCarrinho.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">Carrinho vazio</p>';
    }

    carrinho.forEach(item => {
        const totalDoItem = item.preco * item.quantidade;
        subtotal += totalDoItem;

        const linha = document.createElement("div");
        linha.classList.add("item-linha");
        linha.innerHTML = `
            <span>${item.quantidade}x ${item.nome}</span>
            <strong>R$ ${totalDoItem.toFixed(2).replace('.', ',')}</strong>
        `;
        containerCarrinho.appendChild(linha);
    });

    let porcentagemDesconto = 0;
    const formaPagamentoSelecionada = document.querySelector('input[name="forma-pagto"]:checked').value;
    const campoDescontoBox = document.querySelector(".desconto-dinheiro-box");

    if (formaPagamentoSelecionada === "dinheiro") {
        campoDescontoBox.style.display = "block";
        porcentagemDesconto = parseFloat(inputDescontoExtra.value) || 0;
    } else {
        campoDescontoBox.style.display = "none";
        inputDescontoExtra.value = "";
    }

    const valorDesconto = (subtotal * porcentagemDesconto) / 100;
    const totalGeral = subtotal - valorDesconto;

    txtSubtotal.innerText = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    txtDesconto.innerText = `- R$ ${valorDesconto.toFixed(2).replace('.', ',')}`;
    txtTotal.innerText = `R$ ${totalGeral.toFixed(2).replace('.', ',')}`;
}

// MONITORADORES DE ALTERAÇÃO DE PAGAMENTO
inputDescontoExtra.addEventListener("input", atualizarInterfaceDoCaixa);
opcoesPagamento.forEach(radio => radio.addEventListener("change", atualizarInterfaceDoCaixa));

// ENVIAR OS DADOS DA VENDA PARA A PLANILHA (POST)
document.getElementById("btn-finalizar").addEventListener("click", async () => {
    if (carrinho.length === 0) {
        alert("O carrinho está vazio!");
        return;
    }

    // Formata os dados no padrão solicitado: Itens separados por "|"
    const textoItens = carrinho.map(item => item.nome).join(" | ");
    const textoQuantidades = carrinho.map(item => item.quantidade).join(" | ");
    const formaPagto = document.querySelector('input[name="forma-pagto"]:checked').value;
    const dataAtual = new Date().toLocaleString("pt-BR");

    const dadosVenda = {
        data: dataAtual,
        itens: textoItens,
        quantidades: textoQuantidades,
        valorTotal: txtTotal.innerText,
        formaPagamento: formaPagto.toUpperCase()
    };

    document.getElementById("btn-finalizar").innerText = "Salvando na planilha...";
    document.getElementById("btn-finalizar").disabled = true;

    try {
        const resposta = await fetch(WEB_APP_URL, {
            method: "POST",
            method: "POST",
            body: JSON.stringify(dadosVenda)
        });
        
        const resultado = await resposta.json();
        
        if(resultado.status === "success") {
            alert("Venda registrada com sucesso no Google Sheets!");
            carrinho = [];
            inputDescontoExtra.value = "";
            await carregarProdutosDaPlanilha(); // Recarrega os produtos para atualizar os números de estoque na tela
            atualizarInterfaceDoCaixa();
        } else {
            alert("Erro ao salvar: " + resultado.message);
        }
    } catch(erro) {
        alert("Erro na comunicação com a planilha: " + erro);
    } finally {
        document.getElementById("btn-finalizar").innerText = "Finalizar Venda";
        document.getElementById("btn-finalizar").disabled = false;
    }
});

// INICIALIZAÇÃO
carregarProdutosDaPlanilha();
