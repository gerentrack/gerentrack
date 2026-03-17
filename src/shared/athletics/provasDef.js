// ─── PROVAS_DEF + helpers de provas ─────────────────────────────────────────
const PROVAS_DEF = {
  M: {
    adulto: [
      // Corridas Rasas
      { id: "M_adulto_100m",    nome: "100m Rasos",          tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "M_adulto_200m",    nome: "200m Rasos",          tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "M_adulto_400m",    nome: "400m Rasos",          tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "M_adulto_800m",    nome: "800m",                tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "M_adulto_1500m",   nome: "1.500m",              tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "M_adulto_5000m",   nome: "5.000m",              tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "M_adulto_10000m",  nome: "10.000m",             tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      // Barreiras
      { id: "M_adulto_110mB",   nome: "110m c/ Barreiras (1,067 m)",   tipo: "barreiras",  unidade: "s", grupo: "Corridas c/ Barreiras", especBarreiras: { altura: "1,067 m", saida1a: "13,72m", entre: "9,14m", ultimaCheg: "14,02m" } },
      { id: "M_adulto_400mB",   nome: "400m c/ Barreiras (91,4 cm)",   tipo: "barreiras",  unidade: "s", grupo: "Corridas c/ Barreiras", especBarreiras: { altura: "91,4 cm", saida1a: "45,00m", entre: "35,00m", ultimaCheg: "40,00m" } },
      // Obstáculos
      { id: "M_adulto_3000mObs",nome: "3.000m Obstáculos",   tipo: "obstaculos", unidade: "s", grupo: "Corrida c/ Obstáculos" },
      // Marcha
      { id: "M_adulto_20kmM",   nome: "20.000m Marcha",      tipo: "marcha",     unidade: "s", grupo: "Marcha Atlética" },
      { id: "M_adulto_35kmM",   nome: "35.000m Marcha",      tipo: "marcha",     unidade: "s", grupo: "Marcha Atlética" },
      { id: "M_adulto_revMisto",nome: "Revez. Misto Marcha", tipo: "marcha",     unidade: "s", grupo: "Marcha Atlética", misto: true },
      // Revezamentos
      { id: "M_adulto_4x100m",  nome: "4x100m",              tipo: "revezamento",unidade: "s", grupo: "Revezamentos" },
      { id: "M_adulto_4x400m",  nome: "4x400m",              tipo: "revezamento",unidade: "s", grupo: "Revezamentos" },
      { id: "M_adulto_4x400mix",nome: "4x400m Misto",        tipo: "revezamento",unidade: "s", grupo: "Revezamentos", misto: true },
      // Saltos
      { id: "M_adulto_comp",    nome: "Salto em Distância",  tipo: "salto",      unidade: "m", grupo: "Saltos" },
      { id: "M_adulto_altura",  nome: "Salto em Altura",     tipo: "salto",      unidade: "m", grupo: "Saltos" },
      { id: "M_adulto_triplo",  nome: "Salto Triplo",        tipo: "salto",      unidade: "m", grupo: "Saltos" },
      { id: "M_adulto_vara",    nome: "Salto com Vara",      tipo: "salto",      unidade: "m", grupo: "Saltos" },
      // Lançamentos
      { id: "M_adulto_peso",    nome: "Arremesso do Peso (7,26kg)",   tipo: "lancamento", unidade: "m", grupo: "Arremesso/Lançamentos" },
      { id: "M_adulto_disco",   nome: "Lançamento do Disco (2,0kg)",  tipo: "lancamento", unidade: "m", grupo: "Arremesso/Lançamentos" },
      { id: "M_adulto_dardo",   nome: "Lançamento do Dardo (800g)",   tipo: "lancamento", unidade: "m", grupo: "Arremesso/Lançamentos" },
      { id: "M_adulto_martelo", nome: "Lançamento do Martelo (7,26kg)",tipo: "lancamento",unidade: "m", grupo: "Arremesso/Lançamentos" },
      // Combinada
      { id: "M_adulto_decatlo", nome: "Decatlo",             tipo: "combinada",  unidade: "pts", grupo: "Combinada" },
    ],
    sub23: [
      { id: "M_sub23_100m",    nome: "100m Rasos",          tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "M_sub23_200m",    nome: "200m Rasos",          tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "M_sub23_400m",    nome: "400m Rasos",          tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "M_sub23_800m",    nome: "800m",                tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "M_sub23_1500m",   nome: "1.500m",              tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "M_sub23_5000m",   nome: "5.000m",              tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "M_sub23_10000m",  nome: "10.000m",             tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "M_sub23_110mB",   nome: "110m c/ Barreiras (1,067 m)",   tipo: "barreiras",  unidade: "s", grupo: "Corridas c/ Barreiras", especBarreiras: { altura: "1,067 m", saida1a: "13,72m", entre: "9,14m", ultimaCheg: "14,02m" } },
      { id: "M_sub23_400mB",   nome: "400m c/ Barreiras (91,4 cm)",   tipo: "barreiras",  unidade: "s", grupo: "Corridas c/ Barreiras", especBarreiras: { altura: "91,4 cm", saida1a: "45,00m", entre: "35,00m", ultimaCheg: "40,00m" } },
      { id: "M_sub23_3000mObs",nome: "3.000m Obstáculos",   tipo: "obstaculos", unidade: "s", grupo: "Corrida c/ Obstáculos" },
      { id: "M_sub23_20kmM",   nome: "20.000m Marcha",      tipo: "marcha",     unidade: "s", grupo: "Marcha Atlética" },
      { id: "M_sub23_4x100m",  nome: "4x100m",              tipo: "revezamento",unidade: "s", grupo: "Revezamentos" },
      { id: "M_sub23_4x400m",  nome: "4x400m",              tipo: "revezamento",unidade: "s", grupo: "Revezamentos" },
      { id: "M_sub23_4x400mix",nome: "4x400m Misto",        tipo: "revezamento",unidade: "s", grupo: "Revezamentos", misto: true },
      { id: "M_sub23_comp",    nome: "Salto em Distância",  tipo: "salto",      unidade: "m", grupo: "Saltos" },
      { id: "M_sub23_altura",  nome: "Salto em Altura",     tipo: "salto",      unidade: "m", grupo: "Saltos" },
      { id: "M_sub23_triplo",  nome: "Salto Triplo",        tipo: "salto",      unidade: "m", grupo: "Saltos" },
      { id: "M_sub23_vara",    nome: "Salto com Vara",      tipo: "salto",      unidade: "m", grupo: "Saltos" },
      { id: "M_sub23_peso",    nome: "Arremesso do Peso (7,26kg)",    tipo: "lancamento", unidade: "m", grupo: "Arremesso/Lançamentos" },
      { id: "M_sub23_disco",   nome: "Lançamento do Disco (2,0kg)",   tipo: "lancamento", unidade: "m", grupo: "Arremesso/Lançamentos" },
      { id: "M_sub23_dardo",   nome: "Lançamento do Dardo (800g)",    tipo: "lancamento", unidade: "m", grupo: "Arremesso/Lançamentos" },
      { id: "M_sub23_martelo", nome: "Lançamento do Martelo (7,26kg)",tipo: "lancamento", unidade: "m", grupo: "Arremesso/Lançamentos" },
      { id: "M_sub23_decatlo", nome: "Decatlo",             tipo: "combinada",  unidade: "pts", grupo: "Combinada" },
    ],
    sub20: [
      { id: "M_sub20_100m",    nome: "100m Rasos",          tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "M_sub20_200m",    nome: "200m Rasos",          tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "M_sub20_400m",    nome: "400m Rasos",          tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "M_sub20_800m",    nome: "800m",                tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "M_sub20_1500m",   nome: "1.500m",              tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "M_sub20_3000m",   nome: "3.000m",              tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "M_sub20_5000m",   nome: "5.000m",              tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "M_sub20_110mB",   nome: "110m c/ Barreiras (99,1 cm)",   tipo: "barreiras",  unidade: "s", grupo: "Corridas c/ Barreiras", especBarreiras: { altura: "99,1 cm", saida1a: "13,72m", entre: "9,14m", ultimaCheg: "14,02m" } },
      { id: "M_sub20_400mB",   nome: "400m c/ Barreiras (91,4 cm)",   tipo: "barreiras",  unidade: "s", grupo: "Corridas c/ Barreiras", especBarreiras: { altura: "91,4 cm", saida1a: "45,00m", entre: "35,00m", ultimaCheg: "40,00m" } },
      { id: "M_sub20_3000mObs",nome: "3.000m Obstáculos",   tipo: "obstaculos", unidade: "s", grupo: "Corrida c/ Obstáculos" },
      { id: "M_sub20_10kmM",   nome: "10.000m Marcha",      tipo: "marcha",     unidade: "s", grupo: "Marcha Atlética" },
      { id: "M_sub20_4x100m",  nome: "4x100m",              tipo: "revezamento",unidade: "s", grupo: "Revezamentos" },
      { id: "M_sub20_4x400m",  nome: "4x400m",              tipo: "revezamento",unidade: "s", grupo: "Revezamentos" },
      { id: "M_sub20_4x400mix",nome: "4x400m Misto",        tipo: "revezamento",unidade: "s", grupo: "Revezamentos", misto: true },
      { id: "M_sub20_comp",    nome: "Salto em Distância",  tipo: "salto",      unidade: "m", grupo: "Saltos" },
      { id: "M_sub20_altura",  nome: "Salto em Altura",     tipo: "salto",      unidade: "m", grupo: "Saltos" },
      { id: "M_sub20_triplo",  nome: "Salto Triplo",        tipo: "salto",      unidade: "m", grupo: "Saltos" },
      { id: "M_sub20_vara",    nome: "Salto com Vara",      tipo: "salto",      unidade: "m", grupo: "Saltos" },
      { id: "M_sub20_peso",    nome: "Arremesso do Peso (6kg)",      tipo: "lancamento", unidade: "m", grupo: "Arremesso/Lançamentos" },
      { id: "M_sub20_disco",   nome: "Lançamento do Disco (1,75kg)", tipo: "lancamento", unidade: "m", grupo: "Arremesso/Lançamentos" },
      { id: "M_sub20_dardo",   nome: "Lançamento do Dardo (800g)",   tipo: "lancamento", unidade: "m", grupo: "Arremesso/Lançamentos" },
      { id: "M_sub20_martelo", nome: "Lançamento do Martelo (6kg)",  tipo: "lancamento", unidade: "m", grupo: "Arremesso/Lançamentos" },
      { id: "M_sub20_decatlo", nome: "Decatlo",             tipo: "combinada",  unidade: "pts", grupo: "Combinada" },
    ],
    sub18: [
      { id: "M_sub18_100m",    nome: "100m Rasos",          tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "M_sub18_200m",    nome: "200m Rasos",          tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "M_sub18_400m",    nome: "400m Rasos",          tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "M_sub18_800m",    nome: "800m",                tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "M_sub18_1500m",   nome: "1.500m",              tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "M_sub18_3000m",   nome: "3.000m",              tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "M_sub18_110mB",   nome: "110m c/ Barreiras (91,4 cm)",   tipo: "barreiras",  unidade: "s", grupo: "Corridas c/ Barreiras", especBarreiras: { altura: "91,4 cm", saida1a: "13,72m", entre: "9,14m", ultimaCheg: "14,02m" } },
      { id: "M_sub18_400mB",   nome: "400m c/ Barreiras (83,8 cm)",   tipo: "barreiras",  unidade: "s", grupo: "Corridas c/ Barreiras", especBarreiras: { altura: "83,8 cm", saida1a: "45,00m", entre: "35,00m", ultimaCheg: "40,00m" } },
      { id: "M_sub18_2000mObs",nome: "2.000m Obstáculos",   tipo: "obstaculos", unidade: "s", grupo: "Corrida c/ Obstáculos" },
      { id: "M_sub18_10kmM",   nome: "10.000m Marcha",      tipo: "marcha",     unidade: "s", grupo: "Marcha Atlética" },
      { id: "M_sub18_4x100m",  nome: "4x100m",              tipo: "revezamento",unidade: "s", grupo: "Revezamentos" },
      { id: "M_sub18_4x400m",  nome: "4x400m",              tipo: "revezamento",unidade: "s", grupo: "Revezamentos" },
      { id: "M_sub18_4x400mix",nome: "4x400m Misto",        tipo: "revezamento",unidade: "s", grupo: "Revezamentos", misto: true },
      { id: "M_sub18_comp",    nome: "Salto em Distância",  tipo: "salto",      unidade: "m", grupo: "Saltos" },
      { id: "M_sub18_altura",  nome: "Salto em Altura",     tipo: "salto",      unidade: "m", grupo: "Saltos" },
      { id: "M_sub18_triplo",  nome: "Salto Triplo",        tipo: "salto",      unidade: "m", grupo: "Saltos" },
      { id: "M_sub18_vara",    nome: "Salto com Vara",      tipo: "salto",      unidade: "m", grupo: "Saltos" },
      { id: "M_sub18_peso",    nome: "Arremesso do Peso (5kg)",      tipo: "lancamento", unidade: "m", grupo: "Arremesso/Lançamentos" },
      { id: "M_sub18_disco",   nome: "Lançamento do Disco (1,5kg)",  tipo: "lancamento", unidade: "m", grupo: "Arremesso/Lançamentos" },
      { id: "M_sub18_dardo",   nome: "Lançamento do Dardo (700g)",   tipo: "lancamento", unidade: "m", grupo: "Arremesso/Lançamentos" },
      { id: "M_sub18_martelo", nome: "Lançamento do Martelo (5kg)",  tipo: "lancamento", unidade: "m", grupo: "Arremesso/Lançamentos" },
      { id: "M_sub18_decatlo", nome: "Decatlo",             tipo: "combinada",  unidade: "pts", grupo: "Combinada" },
    ],
    sub16: [
      { id: "M_sub16_75m",     nome: "75m Rasos",           tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "M_sub16_250m",    nome: "250m Rasos",          tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "M_sub16_1000m",   nome: "1.000m",              tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "M_sub16_2000m",   nome: "2.000m",              tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "M_sub16_100mB",   nome: "100m c/ Barreiras (83,8 cm)",   tipo: "barreiras",  unidade: "s", grupo: "Corridas c/ Barreiras", especBarreiras: { altura: "83,8 cm", saida1a: "13,00m", entre: "8,50m", ultimaCheg: "10,50m" } },
      { id: "M_sub16_300mB",   nome: "300m c/ Barreiras (76,2 cm)",   tipo: "barreiras",  unidade: "s", grupo: "Corridas c/ Barreiras", especBarreiras: { altura: "76,2 cm", saida1a: "45,00m", entre: "35,00m", ultimaCheg: "45,00m" } },
      { id: "M_sub16_1500mObs",nome: "1.500m Obstáculos",   tipo: "obstaculos", unidade: "s", grupo: "Corrida c/ Obstáculos" },
      { id: "M_sub16_5kmM",    nome: "5.000m Marcha",       tipo: "marcha",     unidade: "s", grupo: "Marcha Atlética" },
      { id: "M_sub16_4x75m",   nome: "4x75m",               tipo: "revezamento",unidade: "s", grupo: "Revezamentos" },
      { id: "M_sub16_comp",    nome: "Salto em Distância",  tipo: "salto",      unidade: "m", grupo: "Saltos" },
      { id: "M_sub16_altura",  nome: "Salto em Altura",     tipo: "salto",      unidade: "m", grupo: "Saltos" },
      { id: "M_sub16_triplo",  nome: "Salto Triplo",        tipo: "salto",      unidade: "m", grupo: "Saltos" },
      { id: "M_sub16_vara",    nome: "Salto com Vara",      tipo: "salto",      unidade: "m", grupo: "Saltos" },
      { id: "M_sub16_peso",    nome: "Arremesso do Peso (4kg)",     tipo: "lancamento", unidade: "m", grupo: "Arremesso/Lançamentos" },
      { id: "M_sub16_disco",   nome: "Lançamento do Disco (1kg)",   tipo: "lancamento", unidade: "m", grupo: "Arremesso/Lançamentos" },
      { id: "M_sub16_dardo",   nome: "Lançamento do Dardo (600g)",  tipo: "lancamento", unidade: "m", grupo: "Arremesso/Lançamentos" },
      { id: "M_sub16_martelo", nome: "Lançamento do Martelo (4kg)", tipo: "lancamento", unidade: "m", grupo: "Arremesso/Lançamentos" },
      { id: "M_sub16_hexatlo", nome: "Hexatlo",             tipo: "combinada",  unidade: "pts", grupo: "Combinada" },
    ],
    sub14: [
      { id: "M_sub14_60m",     nome: "60m Rasos",           tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "M_sub14_150m",    nome: "150m Rasos",          tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "M_sub14_800m",    nome: "800m",                tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "M_sub14_1500m",   nome: "1.500m",              tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "M_sub14_80mB",    nome: "80m c/ Barreiras (60 a 76,2 cm)",    tipo: "barreiras",  unidade: "s", grupo: "Corridas c/ Barreiras", especBarreiras: { altura: "60 a 76,2 cm", saida1a: "12,00m", entre: "8,00m", ultimaCheg: "12,00m" } },
      { id: "M_sub14_2kmM",    nome: "2.000m Marcha",       tipo: "marcha",     unidade: "s", grupo: "Marcha Atlética" },
      { id: "M_sub14_5x60m",   nome: "5x60m",               tipo: "revezamento",unidade: "s", grupo: "Revezamentos" },
      { id: "M_sub14_comp",    nome: "Salto em Distância",  tipo: "salto",      unidade: "m", grupo: "Saltos" },
      { id: "M_sub14_altura",  nome: "Salto em Altura",     tipo: "salto",      unidade: "m", grupo: "Saltos" },
      { id: "M_sub14_vara",    nome: "Salto com Vara",      tipo: "salto",      unidade: "m", grupo: "Saltos" },
      { id: "M_sub14_peso",    nome: "Arremesso do Peso (3kg)",     tipo: "lancamento", unidade: "m", grupo: "Arremesso/Lançamentos" },
      { id: "M_sub14_disco",   nome: "Lançamento do Disco (750g)",  tipo: "lancamento", unidade: "m", grupo: "Arremesso/Lançamentos" },
      { id: "M_sub14_dardo",   nome: "Lançamento do Dardo (500g)",  tipo: "lancamento", unidade: "m", grupo: "Arremesso/Lançamentos" },
      { id: "M_sub14_martelo", nome: "Lançamento do Martelo (3kg)", tipo: "lancamento", unidade: "m", grupo: "Arremesso/Lançamentos" },
      { id: "M_sub14_tetratlo",nome: "Tetratlo",            tipo: "combinada",  unidade: "pts", grupo: "Combinada" },
    ],
  },
  F: {
    adulto: [
      { id: "F_adulto_100m",    nome: "100m Rasos",          tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "F_adulto_200m",    nome: "200m Rasos",          tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "F_adulto_400m",    nome: "400m Rasos",          tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "F_adulto_800m",    nome: "800m",                tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "F_adulto_1500m",   nome: "1.500m",              tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "F_adulto_5000m",   nome: "5.000m",              tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "F_adulto_10000m",  nome: "10.000m",             tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "F_adulto_100mB",   nome: "100m c/ Barreiras (83,8 cm)",   tipo: "barreiras",  unidade: "s", grupo: "Corridas c/ Barreiras", especBarreiras: { altura: "83,8 cm", saida1a: "13,00m", entre: "8,50m", ultimaCheg: "10,50m" } },
      { id: "F_adulto_400mB",   nome: "400m c/ Barreiras (76,2 cm)",   tipo: "barreiras",  unidade: "s", grupo: "Corridas c/ Barreiras", especBarreiras: { altura: "76,2 cm", saida1a: "45,00m", entre: "35,00m", ultimaCheg: "40,00m" } },
      { id: "F_adulto_3000mObs",nome: "3.000m Obstáculos",   tipo: "obstaculos", unidade: "s", grupo: "Corrida c/ Obstáculos" },
      { id: "F_adulto_20kmM",   nome: "20.000m Marcha",      tipo: "marcha",     unidade: "s", grupo: "Marcha Atlética" },
      { id: "F_adulto_35kmM",   nome: "35.000m Marcha",      tipo: "marcha",     unidade: "s", grupo: "Marcha Atlética" },
      { id: "F_adulto_revMisto",nome: "Revez. Misto Marcha", tipo: "marcha",     unidade: "s", grupo: "Marcha Atlética", misto: true, oculto: true },
      { id: "F_adulto_4x100m",  nome: "4x100m",              tipo: "revezamento",unidade: "s", grupo: "Revezamentos" },
      { id: "F_adulto_4x400m",  nome: "4x400m",              tipo: "revezamento",unidade: "s", grupo: "Revezamentos" },
      { id: "F_adulto_4x400mix",nome: "4x400m Misto",        tipo: "revezamento",unidade: "s", grupo: "Revezamentos", misto: true, oculto: true },
      { id: "F_adulto_comp",    nome: "Salto em Distância",  tipo: "salto",      unidade: "m", grupo: "Saltos" },
      { id: "F_adulto_altura",  nome: "Salto em Altura",     tipo: "salto",      unidade: "m", grupo: "Saltos" },
      { id: "F_adulto_triplo",  nome: "Salto Triplo",        tipo: "salto",      unidade: "m", grupo: "Saltos" },
      { id: "F_adulto_vara",    nome: "Salto com Vara",      tipo: "salto",      unidade: "m", grupo: "Saltos" },
      { id: "F_adulto_peso",    nome: "Arremesso do Peso (4kg)",     tipo: "lancamento", unidade: "m", grupo: "Arremesso/Lançamentos" },
      { id: "F_adulto_disco",   nome: "Lançamento do Disco (1,0kg)", tipo: "lancamento", unidade: "m", grupo: "Arremesso/Lançamentos" },
      { id: "F_adulto_dardo",   nome: "Lançamento do Dardo (600g)",  tipo: "lancamento", unidade: "m", grupo: "Arremesso/Lançamentos" },
      { id: "F_adulto_martelo", nome: "Lançamento do Martelo (4kg)", tipo: "lancamento", unidade: "m", grupo: "Arremesso/Lançamentos" },
      { id: "F_adulto_heptatlo",nome: "Heptatlo",            tipo: "combinada",  unidade: "pts", grupo: "Combinada" },
    ],
    sub23: [
      { id: "F_sub23_100m",    nome: "100m Rasos",          tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "F_sub23_200m",    nome: "200m Rasos",          tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "F_sub23_400m",    nome: "400m Rasos",          tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "F_sub23_800m",    nome: "800m",                tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "F_sub23_1500m",   nome: "1.500m",              tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "F_sub23_5000m",   nome: "5.000m",              tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "F_sub23_10000m",  nome: "10.000m",             tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "F_sub23_100mB",   nome: "100m c/ Barreiras (83,8 cm)",   tipo: "barreiras",  unidade: "s", grupo: "Corridas c/ Barreiras", especBarreiras: { altura: "83,8 cm", saida1a: "13,00m", entre: "8,50m", ultimaCheg: "10,50m" } },
      { id: "F_sub23_400mB",   nome: "400m c/ Barreiras (76,2 cm)",   tipo: "barreiras",  unidade: "s", grupo: "Corridas c/ Barreiras", especBarreiras: { altura: "76,2 cm", saida1a: "45,00m", entre: "35,00m", ultimaCheg: "40,00m" } },
      { id: "F_sub23_3000mObs",nome: "3.000m Obstáculos",   tipo: "obstaculos", unidade: "s", grupo: "Corrida c/ Obstáculos" },
      { id: "F_sub23_20kmM",   nome: "20.000m Marcha",      tipo: "marcha",     unidade: "s", grupo: "Marcha Atlética" },
      { id: "F_sub23_4x100m",  nome: "4x100m",              tipo: "revezamento",unidade: "s", grupo: "Revezamentos" },
      { id: "F_sub23_4x400m",  nome: "4x400m",              tipo: "revezamento",unidade: "s", grupo: "Revezamentos" },
      { id: "F_sub23_4x400mix",nome: "4x400m Misto",        tipo: "revezamento",unidade: "s", grupo: "Revezamentos", misto: true, oculto: true },
      { id: "F_sub23_comp",    nome: "Salto em Distância",  tipo: "salto",      unidade: "m", grupo: "Saltos" },
      { id: "F_sub23_altura",  nome: "Salto em Altura",     tipo: "salto",      unidade: "m", grupo: "Saltos" },
      { id: "F_sub23_triplo",  nome: "Salto Triplo",        tipo: "salto",      unidade: "m", grupo: "Saltos" },
      { id: "F_sub23_vara",    nome: "Salto com Vara",      tipo: "salto",      unidade: "m", grupo: "Saltos" },
      { id: "F_sub23_peso",    nome: "Arremesso do Peso (4kg)",     tipo: "lancamento", unidade: "m", grupo: "Arremesso/Lançamentos" },
      { id: "F_sub23_disco",   nome: "Lançamento do Disco (1,0kg)", tipo: "lancamento", unidade: "m", grupo: "Arremesso/Lançamentos" },
      { id: "F_sub23_dardo",   nome: "Lançamento do Dardo (600g)",  tipo: "lancamento", unidade: "m", grupo: "Arremesso/Lançamentos" },
      { id: "F_sub23_martelo", nome: "Lançamento do Martelo (4kg)", tipo: "lancamento", unidade: "m", grupo: "Arremesso/Lançamentos" },
      { id: "F_sub23_heptatlo",nome: "Heptatlo",            tipo: "combinada",  unidade: "pts", grupo: "Combinada" },
    ],
    sub20: [
      { id: "F_sub20_100m",    nome: "100m Rasos",          tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "F_sub20_200m",    nome: "200m Rasos",          tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "F_sub20_400m",    nome: "400m Rasos",          tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "F_sub20_800m",    nome: "800m",                tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "F_sub20_1500m",   nome: "1.500m",              tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "F_sub20_3000m",   nome: "3.000m",              tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "F_sub20_5000m",   nome: "5.000m",              tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "F_sub20_100mB",   nome: "100m c/ Barreiras (83,8 cm)",   tipo: "barreiras",  unidade: "s", grupo: "Corridas c/ Barreiras", especBarreiras: { altura: "83,8 cm", saida1a: "13,00m", entre: "8,50m", ultimaCheg: "10,50m" } },
      { id: "F_sub20_400mB",   nome: "400m c/ Barreiras (76,2 cm)",   tipo: "barreiras",  unidade: "s", grupo: "Corridas c/ Barreiras", especBarreiras: { altura: "76,2 cm", saida1a: "45,00m", entre: "35,00m", ultimaCheg: "40,00m" } },
      { id: "F_sub20_3000mObs",nome: "3.000m Obstáculos",   tipo: "obstaculos", unidade: "s", grupo: "Corrida c/ Obstáculos" },
      { id: "F_sub20_10kmM",   nome: "10.000m Marcha",      tipo: "marcha",     unidade: "s", grupo: "Marcha Atlética" },
      { id: "F_sub20_4x100m",  nome: "4x100m",              tipo: "revezamento",unidade: "s", grupo: "Revezamentos" },
      { id: "F_sub20_4x400m",  nome: "4x400m",              tipo: "revezamento",unidade: "s", grupo: "Revezamentos" },
      { id: "F_sub20_4x400mix",nome: "4x400m Misto",        tipo: "revezamento",unidade: "s", grupo: "Revezamentos", misto: true, oculto: true },
      { id: "F_sub20_comp",    nome: "Salto em Distância",  tipo: "salto",      unidade: "m", grupo: "Saltos" },
      { id: "F_sub20_altura",  nome: "Salto em Altura",     tipo: "salto",      unidade: "m", grupo: "Saltos" },
      { id: "F_sub20_triplo",  nome: "Salto Triplo",        tipo: "salto",      unidade: "m", grupo: "Saltos" },
      { id: "F_sub20_vara",    nome: "Salto com Vara",      tipo: "salto",      unidade: "m", grupo: "Saltos" },
      { id: "F_sub20_peso",    nome: "Arremesso do Peso (4kg)",     tipo: "lancamento", unidade: "m", grupo: "Arremesso/Lançamentos" },
      { id: "F_sub20_disco",   nome: "Lançamento do Disco (1,0kg)", tipo: "lancamento", unidade: "m", grupo: "Arremesso/Lançamentos" },
      { id: "F_sub20_dardo",   nome: "Lançamento do Dardo (600g)",  tipo: "lancamento", unidade: "m", grupo: "Arremesso/Lançamentos" },
      { id: "F_sub20_martelo", nome: "Lançamento do Martelo (4kg)", tipo: "lancamento", unidade: "m", grupo: "Arremesso/Lançamentos" },
      { id: "F_sub20_heptatlo",nome: "Heptatlo",            tipo: "combinada",  unidade: "pts", grupo: "Combinada" },
    ],
    sub18: [
      { id: "F_sub18_100m",    nome: "100m Rasos",          tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "F_sub18_200m",    nome: "200m Rasos",          tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "F_sub18_400m",    nome: "400m Rasos",          tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "F_sub18_800m",    nome: "800m",                tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "F_sub18_1500m",   nome: "1.500m",              tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "F_sub18_3000m",   nome: "3.000m",              tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "F_sub18_100mB",   nome: "100m c/ Barreiras (76,2 cm)",   tipo: "barreiras",  unidade: "s", grupo: "Corridas c/ Barreiras", especBarreiras: { altura: "76,2 cm", saida1a: "13,00m", entre: "8,50m", ultimaCheg: "10,50m" } },
      { id: "F_sub18_400mB",   nome: "400m c/ Barreiras (76,2 cm)",   tipo: "barreiras",  unidade: "s", grupo: "Corridas c/ Barreiras", especBarreiras: { altura: "76,2 cm", saida1a: "45,00m", entre: "35,00m", ultimaCheg: "40,00m" } },
      { id: "F_sub18_2000mObs",nome: "2.000m Obstáculos",   tipo: "obstaculos", unidade: "s", grupo: "Corrida c/ Obstáculos" },
      { id: "F_sub18_5kmM",    nome: "5.000m Marcha",       tipo: "marcha",     unidade: "s", grupo: "Marcha Atlética" },
      { id: "F_sub18_4x100m",  nome: "4x100m",              tipo: "revezamento",unidade: "s", grupo: "Revezamentos" },
      { id: "F_sub18_4x400m",  nome: "4x400m",              tipo: "revezamento",unidade: "s", grupo: "Revezamentos" },
      { id: "F_sub18_4x400mix",nome: "4x400m Misto",        tipo: "revezamento",unidade: "s", grupo: "Revezamentos", misto: true, oculto: true },
      { id: "F_sub18_comp",    nome: "Salto em Distância",  tipo: "salto",      unidade: "m", grupo: "Saltos" },
      { id: "F_sub18_altura",  nome: "Salto em Altura",     tipo: "salto",      unidade: "m", grupo: "Saltos" },
      { id: "F_sub18_triplo",  nome: "Salto Triplo",        tipo: "salto",      unidade: "m", grupo: "Saltos" },
      { id: "F_sub18_vara",    nome: "Salto com Vara",      tipo: "salto",      unidade: "m", grupo: "Saltos" },
      { id: "F_sub18_peso",    nome: "Arremesso do Peso (3kg)",     tipo: "lancamento", unidade: "m", grupo: "Arremesso/Lançamentos" },
      { id: "F_sub18_disco",   nome: "Lançamento do Disco (1,0kg)", tipo: "lancamento", unidade: "m", grupo: "Arremesso/Lançamentos" },
      { id: "F_sub18_dardo",   nome: "Lançamento do Dardo (500g)",  tipo: "lancamento", unidade: "m", grupo: "Arremesso/Lançamentos" },
      { id: "F_sub18_martelo", nome: "Lançamento do Martelo (3kg)", tipo: "lancamento", unidade: "m", grupo: "Arremesso/Lançamentos" },
      { id: "F_sub18_heptatlo",nome: "Heptatlo",            tipo: "combinada",  unidade: "pts", grupo: "Combinada" },
    ],
    sub16: [
      { id: "F_sub16_75m",     nome: "75m Rasos",           tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "F_sub16_250m",    nome: "250m Rasos",          tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "F_sub16_1000m",   nome: "1.000m",              tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "F_sub16_2000m",   nome: "2.000m",              tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "F_sub16_80mB",    nome: "80m c/ Barreiras (76,2 cm)",    tipo: "barreiras",  unidade: "s", grupo: "Corridas c/ Barreiras", especBarreiras: { altura: "76,2 cm", saida1a: "12,00m", entre: "8,00m", ultimaCheg: "12,00m" } },
      { id: "F_sub16_300mB",   nome: "300m c/ Barreiras (76,2 cm)",   tipo: "barreiras",  unidade: "s", grupo: "Corridas c/ Barreiras", especBarreiras: { altura: "76,2 cm", saida1a: "45,00m", entre: "35,00m", ultimaCheg: "45,00m" } },
      { id: "F_sub16_1500mObs",nome: "1.500m Obstáculos",   tipo: "obstaculos", unidade: "s", grupo: "Corrida c/ Obstáculos" },
      { id: "F_sub16_3kmM",    nome: "3.000m Marcha",       tipo: "marcha",     unidade: "s", grupo: "Marcha Atlética" },
      { id: "F_sub16_4x75m",   nome: "4x75m",               tipo: "revezamento",unidade: "s", grupo: "Revezamentos" },
      { id: "F_sub16_comp",    nome: "Salto em Distância",  tipo: "salto",      unidade: "m", grupo: "Saltos" },
      { id: "F_sub16_triplo",  nome: "Salto Triplo",        tipo: "salto",      unidade: "m", grupo: "Saltos" },
      { id: "F_sub16_altura",  nome: "Salto em Altura",     tipo: "salto",      unidade: "m", grupo: "Saltos" },
      { id: "F_sub16_vara",    nome: "Salto com Vara",      tipo: "salto",      unidade: "m", grupo: "Saltos" },
      { id: "F_sub16_peso",    nome: "Arremesso do Peso (3kg)",     tipo: "lancamento", unidade: "m", grupo: "Arremesso/Lançamentos" },
      { id: "F_sub16_disco",   nome: "Lançamento do Disco (750g)",  tipo: "lancamento", unidade: "m", grupo: "Arremesso/Lançamentos" },
      { id: "F_sub16_dardo",   nome: "Lançamento do Dardo (500g)",  tipo: "lancamento", unidade: "m", grupo: "Arremesso/Lançamentos" },
      { id: "F_sub16_martelo", nome: "Lançamento do Martelo (3kg)", tipo: "lancamento", unidade: "m", grupo: "Arremesso/Lançamentos" },
      { id: "F_sub16_pentatlo",nome: "Pentatlo",            tipo: "combinada",  unidade: "pts", grupo: "Combinada" },
    ],
    sub14: [
      { id: "F_sub14_60m",     nome: "60m Rasos",           tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "F_sub14_150m",    nome: "150m Rasos",          tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "F_sub14_800m",    nome: "800m",                tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "F_sub14_1500m",   nome: "1.500m",              tipo: "rasa",       unidade: "s", grupo: "Corridas Rasas" },
      { id: "F_sub14_60mB",    nome: "60m c/ Barreiras (60 a 76,2 cm)",    tipo: "barreiras",  unidade: "s", grupo: "Corridas c/ Barreiras", especBarreiras: { altura: "60 a 76,2 cm", saida1a: "12,00m", entre: "7,50m", ultimaCheg: "10,50m" } },
      { id: "F_sub14_2kmM",    nome: "2.000m Marcha",       tipo: "marcha",     unidade: "s", grupo: "Marcha Atlética" },
      { id: "F_sub14_5x60m",   nome: "5x60m",               tipo: "revezamento",unidade: "s", grupo: "Revezamentos" },
      { id: "F_sub14_comp",    nome: "Salto em Distância",  tipo: "salto",      unidade: "m", grupo: "Saltos" },
      { id: "F_sub14_altura",  nome: "Salto em Altura",     tipo: "salto",      unidade: "m", grupo: "Saltos" },
      { id: "F_sub14_vara",    nome: "Salto com Vara",      tipo: "salto",      unidade: "m", grupo: "Saltos" },
      { id: "F_sub14_peso",    nome: "Arremesso do Peso (3kg)",     tipo: "lancamento", unidade: "m", grupo: "Arremesso/Lançamentos" },
      { id: "F_sub14_disco",   nome: "Lançamento do Disco (750g)",  tipo: "lancamento", unidade: "m", grupo: "Arremesso/Lançamentos" },
      { id: "F_sub14_dardo",   nome: "Lançamento do Dardo (400g)",  tipo: "lancamento", unidade: "m", grupo: "Arremesso/Lançamentos" },
      { id: "F_sub14_martelo", nome: "Lançamento do Martelo (2kg)", tipo: "lancamento", unidade: "m", grupo: "Arremesso/Lançamentos" },
      { id: "F_sub14_tetratlo",nome: "Tetratlo",            tipo: "combinada",  unidade: "pts", grupo: "Combinada" },
    ],
  },
};

// Helper: retorna as provas disponíveis para um sexo + categoria
function getProvasCat(sexo, catId) {
  return (PROVAS_DEF[sexo] && PROVAS_DEF[sexo][catId]) ? PROVAS_DEF[sexo][catId] : [];
}

// Helper: retorna todos as provas únicas (para súmulas / resultados)
function todasAsProvas() {
  const map = {};
  Object.values(PROVAS_DEF).forEach((cats) => {
    Object.values(cats).forEach((provas) => {
      provas.forEach((p) => {
        // Provas mistas F_ são ocultas — usar apenas a versão M_ canônica
        if (!p.oculto) map[p.id] = p;
      });
    });
  });
  return Object.values(map);
}

// ─── REVEZAMENTO: HELPERS ──────────────────────────────────────────────────
// Extrai nº de pernas do revezamento a partir do nome/id (4x100m → 4, 5x60m → 5)
function nPernasRevezamento(prova) {
  if (!prova) return 4;
  const m = (prova.nome || prova.id || "").match(/(\d+)x/i);
  return m ? parseInt(m[1]) : 4;
}

// Verifica se é prova mista (aceita M e F na mesma equipe)
function isRevezamentoMisto(prova) {
  return (prova?.nome || prova?.id || "").toLowerCase().includes("mist");
}

// ─── PROVAS COMBINADAS: COMPOSIÇÃO ──────────────────────────────────────────
// Mapeia cada tipo de prova combinada para suas provas componentes na ordem oficial
// As chaves usam o sufixo do ID da prova (ex: "decatlo", "heptatlo")
// Os valores são arrays com { sufixo, nome, tipo, unidade, dia } na ordem oficial
const COMPOSICAO_COMBINADAS = {
  decatlo: {
    nome: "Decatlo",
    sexo: "M",
    totalProvas: 10,
    provas: [
      { sufixo: "100m",   nome: "100m Rasos",              tipo: "rasa",      unidade: "s",  dia: 1 },
      { sufixo: "comp",   nome: "Salto em Distância",      tipo: "salto",     unidade: "m",  dia: 1 },
      { sufixo: "peso",   nome: "Arremesso do Peso",       tipo: "lancamento",unidade: "m",  dia: 1 },
      { sufixo: "altura", nome: "Salto em Altura",         tipo: "salto",     unidade: "m",  dia: 1 },
      { sufixo: "400m",   nome: "400m Rasos",              tipo: "rasa",      unidade: "s",  dia: 1 },
      { sufixo: "110mB",  nome: "110m c/ Barreiras",       tipo: "barreiras", unidade: "s",  dia: 2 },
      { sufixo: "disco",  nome: "Lançamento do Disco",     tipo: "lancamento",unidade: "m",  dia: 2 },
      { sufixo: "vara",   nome: "Salto com Vara",          tipo: "salto",     unidade: "m",  dia: 2 },
      { sufixo: "dardo",  nome: "Lançamento do Dardo",     tipo: "lancamento",unidade: "m",  dia: 2 },
      { sufixo: "1500m",  nome: "1.500m",                  tipo: "rasa",      unidade: "s",  dia: 2 },
    ]
  },
  heptatlo: {
    nome: "Heptatlo",
    sexo: "F",
    totalProvas: 7,
    provas: [
      { sufixo: "100mB",  nome: "100m c/ Barreiras",       tipo: "barreiras", unidade: "s",  dia: 1 },
      { sufixo: "altura", nome: "Salto em Altura",         tipo: "salto",     unidade: "m",  dia: 1 },
      { sufixo: "peso",   nome: "Arremesso do Peso",       tipo: "lancamento",unidade: "m",  dia: 1 },
      { sufixo: "200m",   nome: "200m Rasos",              tipo: "rasa",      unidade: "s",  dia: 1 },
      { sufixo: "comp",   nome: "Salto em Distância",      tipo: "salto",     unidade: "m",  dia: 2 },
      { sufixo: "dardo",  nome: "Lançamento do Dardo",     tipo: "lancamento",unidade: "m",  dia: 2 },
      { sufixo: "800m",   nome: "800m",                    tipo: "rasa",      unidade: "s",  dia: 2 },
    ]
  },
  pentatlo: {
    nome: "Pentatlo",
    sexo: "F",
    totalProvas: 5,
    provas: [
      { sufixo: "80mB",   nome: "80m c/ Barreiras",        tipo: "barreiras", unidade: "s",  dia: 1 },
      { sufixo: "altura", nome: "Salto em Altura",         tipo: "salto",     unidade: "m",  dia: 1 },
      { sufixo: "peso",   nome: "Arremesso do Peso",       tipo: "lancamento",unidade: "m",  dia: 1 },
      { sufixo: "comp",   nome: "Salto em Distância",      tipo: "salto",     unidade: "m",  dia: 1 },
      { sufixo: "800m",   nome: "800m",                    tipo: "rasa",      unidade: "s",  dia: 1 },
    ]
  },
  hexatlo: {
    nome: "Hexatlo",
    sexo: "M",
    totalProvas: 6,
    provas: [
      { sufixo: "100mB",  nome: "100m c/ Barreiras",       tipo: "barreiras", unidade: "s",  dia: 1 },
      { sufixo: "altura", nome: "Salto em Altura",         tipo: "salto",     unidade: "m",  dia: 1 },
      { sufixo: "peso",   nome: "Arremesso do Peso",       tipo: "lancamento",unidade: "m",  dia: 1 },
      { sufixo: "comp",   nome: "Salto em Distância",      tipo: "salto",     unidade: "m",  dia: 2 },
      { sufixo: "dardo",  nome: "Lançamento do Dardo",     tipo: "lancamento",unidade: "m",  dia: 2 },
      { sufixo: "800m",   nome: "800m",                    tipo: "rasa",      unidade: "s",  dia: 2 },
    ]
  },
  tetratlo: {
    nome: "Tetratlo",
    totalProvas: 4,
    provasM: [
      { sufixo: "60mB",   nome: "60m c/ Barreiras",        tipo: "barreiras", unidade: "s",  dia: 1 },
      { sufixo: "peso",   nome: "Arremesso do Peso",       tipo: "lancamento",unidade: "m",  dia: 1 },
      { sufixo: "comp",   nome: "Salto em Distância",      tipo: "salto",     unidade: "m",  dia: 1 },
      { sufixo: "800m",   nome: "800m",                    tipo: "rasa",      unidade: "s",  dia: 1 },
    ],
    provasF: [
      { sufixo: "60mB",   nome: "60m c/ Barreiras",        tipo: "barreiras", unidade: "s",  dia: 1 },
      { sufixo: "peso",   nome: "Arremesso do Peso",       tipo: "lancamento",unidade: "m",  dia: 1 },
      { sufixo: "comp",   nome: "Salto em Distância",      tipo: "salto",     unidade: "m",  dia: 1 },
      { sufixo: "800m",   nome: "800m",                    tipo: "rasa",      unidade: "s",  dia: 1 },
    ]
  },
};

// Retorna a composição de uma prova combinada a partir do seu ID
// Ex: "M_adulto_decatlo" → { nome, provas: [...], totalProvas }
function getComposicaoCombinada(provaId) {
  const partes = provaId.split("_");
  const sexo = partes[0]; // M ou F
  const sufixo = partes[partes.length - 1]; // decatlo, heptatlo, etc.
  const comp = COMPOSICAO_COMBINADAS[sufixo];
  if (!comp) return null;
  // Tetratlo tem provas diferentes por sexo
  const provas = comp.provas || (sexo === "M" ? comp.provasM : comp.provasF) || [];
  return {
    nome: comp.nome,
    totalProvas: provas.length,
    provas: provas,
  };
}

export { todasAsProvas, getComposicaoCombinada, nPernasRevezamento, isRevezamentoMisto, COMPOSICAO_COMBINADAS };
