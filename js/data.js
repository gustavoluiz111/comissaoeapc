const GROUPS_DATA = {
    "3A": [
        {
            id: "3A-G1",
            turma: "3º ANO A",
            number: 1,
            representative: "Alícia Nicolly da Silva Souza",
            members: [
                "Ana Letícia Barbosa da Silva",
                "Milena Maria Bezerra",
                "Fábio de Souza Costa Filho",
                "Mateus Ferrari Cavalcanti de Melo",
                "Clarice Maria da Silva",
                "Emilly Gabrielly Guedes da Silva"
            ]
        },
        {
            id: "3A-G2",
            turma: "3º ANO A",
            number: 2,
            representative: "Everton Thyago Maurino da Silva",
            members: [
                "Ana Júlia Trindade Coutinho Ferreira",
                "Éwerton de Freitas Pereira Filho",
                "Genivaldo Marinho de Barros Neto",
                "Heitor Vitor Moura do Nascimento",
                "Júlia Vitória Bezerra de Andrade Chagas",
                "Raquel Sthephany Lopes de Lima Silva"
            ]
        },
        {
            id: "3A-G3",
            turma: "3º ANO A",
            number: 3,
            representative: "João Pedro Morais da Costa",
            members: [
                "Camila Felipe de Morais",
                "Gabriela Ribeiro de Lima",
                "Glória Maria de Barros Moura",
                "Heloísa Vitória dos Santos Pedrosa",
                "Júlia Beatriz de Lima Santana",
                "Paulo José de Santana Júnior"
            ]
        },
        {
            id: "3A-G4",
            turma: "3º ANO A",
            number: 4,
            representative: "Ana Beatriz de Araújo Costa",
            members: [
                "Maria Giovanna Dias Mota",
                "Syllas Miguel do Nascimento Silva",
                "Raquel Germano de Lira e Sousa",
                "Joicylânia Tereza Marinho Chaves",
                "Samara Beatriz de Araújo Silva",
                "Carlos Emanuel Santos da Silva"
            ]
        },
        {
            id: "3A-G5",
            turma: "3º ANO A",
            number: 5,
            representative: "Ayala Maria do Nascimento Alencar",
            members: [
                "Maria Safira da Silva Lima",
                "Sabrina Gabrielly de Lima",
                "Samuel Pereira Calixto",
                "Ana Beatriz Ferreira da Silva",
                "Ana Lívia da Silva",
                "Nathalya Ellen das Neves Farias"
            ]
        },
        {
            id: "3A-G6",
            turma: "3º ANO A",
            number: 6,
            representative: "Marianne Tavares Silva Lacerda",
            members: [
                "Annally Carla Santana de Lima",
                "Humberto Vitor Costa e Silva",
                "Lucas Araújo Ferreira",
                "Álvaro Nascimento de Araújo Lima",
                "Maria Clara de Oliveira Santos",
                "Viviane Beatriz Souza de Melo"
            ]
        }
    ],
    "3B": [
        {
            id: "3B-G1",
            turma: "3º ANO B",
            number: 1,
            representative: "Luiz Gustavo Cavalcante de Lira",
            members: [
                "Emanuel de Barros Barbosa",
                "Samyra Cavalcanti do Nascimento Melo",
                "Arthur Antonio Magalhães da Silva",
                "Maria Eduarda Ferreira da Silva",
                "Cynthia Gabrielle Oliveira da Cunha Lopes",
                "Ana Karine Marcolino Alves Guimarães",
                "Luiz Henrique Pedrosa Pereira da Silva"
            ]
        },
        {
            id: "3B-G2",
            turma: "3º ANO B",
            number: 2,
            representative: "José Thiago Torres Gomes da Silva",
            members: [
                "Rafael Mateus Farias da Silva",
                "Efigenio Barrozo de Morais Filho",
                "Lucas Rozendo dos Santos",
                "Guilherme Gabriel Barbosa da Cruz Cardoso",
                "Ivson Luiz Ferreira Cardoso",
                "Marlison Willis Pessoa Silva",
                "Raylander Kellyson da Silva"
            ]
        },
        {
            id: "3B-G3",
            turma: "3º ANO B",
            number: 3,
            representative: "Laura Mendes da Silva",
            members: [
                "Maria Clara Alves Pereira",
                "Inalda Regina Menezes de Souza",
                "Thayse Milena Santana de Oliveira",
                "Luanna Letycia de Lima Coelho",
                "Aryane Letícia de Araújo Barboza",
                "Raissa Agra de Alencar Cruz Modesto Duarte",
                "Deysiany Kariny da Silva Melo"
            ]
        },
        {
            id: "3B-G4",
            turma: "3º ANO B",
            number: 4,
            representative: "João Pedro de Albuquerque Santiago",
            members: [
                "David Lucas Ferreira Cavalcanti",
                "Karina Pereira Ferreira da Silva"
            ]
        },
        {
            id: "3B-G5",
            turma: "3º ANO B",
            number: 5,
            representative: "Anderson Alecsandro da Silva",
            members: [
                "Ruan Vinicius Mendes da Silva",
                "Pedro Henrique Vilarim Ribeiro Viana",
                "Luis Felipe Figueiredo Rocha",
                "João Gabriel Tavares da Silva",
                "Kamila Melo de Farias",
                "Laura Beatriz de Andrade Santana",
                "Ana Lívia de Figueiredo Oliveira"
            ]
        }
    ]
};

// Flattened list for the scheduler
const ALL_GROUPS = [...GROUPS_DATA["3A"], ...GROUPS_DATA["3B"]];
