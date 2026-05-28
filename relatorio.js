const WEB_APP_URL =
"https://script.google.com/macros/s/AKfycbx0u4QmQoU3Z0o3SEDIZNcfM0wD2S4jpLvoaEUIayIkLuSHi1rncjUtWlFcwJx6DQQ/exec";

const listaRelatorio =
document.getElementById("lista-relatorio");

const totalGeral =
document.getElementById("valor-total-geral");

let vendas = [];

// =============================
// CARREGAR VENDAS
// =============================
async function carregarRelatorio() {

    try {

        const resposta = await fetch(
            `${WEB_APP_URL}?tipo=relatorio`
        );

        vendas = await resposta.json();

        renderizarRelatorio(vendas);

    } catch (erro) {

        listaRelatorio.innerHTML = `
            <p style="color:red;">
                ${erro}
            </p>
        `;
    }
}

// =============================
// RENDERIZAR
// =============================
function renderizarRelatorio(lista) {

    listaRelatorio.innerHTML = "";

    let total = 0;

    if (lista.length === 0) {

        listaRelatorio.innerHTML = `
            <p>Nenhuma venda encontrada.</p>
        `;

        totalGeral.innerText = "R$ 0,00";

        return;
    }

    lista.forEach(venda => {

        total += Number(venda.valor);

        const card = document.createElement("div");

        card.classList.add("item-linha");

        card.style.marginBottom = "15px";

        card.innerHTML = `
            <div style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                width:100%;
            ">

                <div>

                    <strong>${venda.itens}</strong>

                    <br>

                    <small>
                        ${venda.quantidades}
                    </small>

                    <br>

                    <small>
                        ${venda.data}
                    </small>

                </div>

                <div style="text-align:right;">

                    <strong>
                        R$ ${Number(venda.valor)
                            .toFixed(2)
                            .replace('.', ',')}
                    </strong>

                    <br>

                    <small>
                        ${venda.formaPagamento}
                    </small>

                </div>

            </div>
        `;

        listaRelatorio.appendChild(card);
    });

    totalGeral.innerText =
        `R$ ${total.toFixed(2).replace('.', ',')}`;
}

// =============================
// FILTRAR
// =============================
document
.getElementById("btn-filtrar")
.addEventListener("click", () => {

    const filtroData =
        document.getElementById("filtro-data").value;

    const filtroProduto =
        document.getElementById("filtro-produto")
        .value
        .toLowerCase();

    const filtroPagamento =
        document.getElementById("filtro-pagamento")
        .value;

    let filtrado = vendas.filter(venda => {

        let valido = true;

        // DATA
        if (filtroData) {

            const dataVenda =
                new Date(venda.data)
                .toISOString()
                .split("T")[0];

            if (dataVenda !== filtroData) {
                valido = false;
            }
        }

        // PRODUTO
        if (
            filtroProduto &&
            !venda.itens.toLowerCase()
            .includes(filtroProduto)
        ) {
            valido = false;
        }

        // PAGAMENTO
        if (
            filtroPagamento &&
            venda.formaPagamento !== filtroPagamento
        ) {
            valido = false;
        }

        return valido;
    });

    renderizarRelatorio(filtrado);
});

// =============================
// INICIAR
// =============================
carregarRelatorio();
