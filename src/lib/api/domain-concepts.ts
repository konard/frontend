/**
 * GraphQL API для доменных концептов (онтология человека)
 * Загружает ~11000-15000 концептов иерархии аттракторов
 */

import { graphqlClient } from '$lib/graphql-client';

// Интерфейс для доменного концепта
export interface DomainConcept {
  id: number;
  path: string;
  depth: number;
  parentId?: number;
  dictionaries: {
    name: string;
    description?: string;
    language: {
      code: string;
    };
  }[];
  children?: DomainConcept[];
}

// Интерфейс для плоского списка концептов
export interface FlatConcept {
  id: number;
  path: string;
  depth: number;
  parentId?: number;
  name: string;
  description?: string;
}

/**
 * Получить корневые концепты онтологии (depth = 0)
 * Это 7 основных категорий аттракторов
 */
export async function getRootDomainConcepts(languageCode: string = 'ru') {
  const query = `
    query GetRootDomainConcepts {
      concepts(depth: 0) {
        id
        path
        depth
        dictionaries {
          name
          description
          language {
            code
          }
        }
      }
    }
  `;

  const response = await graphqlClient.request<{ concepts: DomainConcept[] }>(query);
  return response.concepts;
}

/**
 * Получить дочерние концепты для заданного родителя
 */
export async function getChildConcepts(parentId: number, languageCode: string = 'ru') {
  const query = `
    query GetChildConcepts($parentId: Int!) {
      concepts(parentId: $parentId) {
        id
        path
        depth
        parentId
        dictionaries {
          name
          description
          language {
            code
          }
        }
      }
    }
  `;

  const response = await graphqlClient.request<{ concepts: DomainConcept[] }>(query, {
    parentId
  });
  return response.concepts;
}

/**
 * Получить дерево концептов до определенной глубины
 * ВНИМАНИЕ: Для больших деревьев (depth > 3) может быть медленно
 * Примечание: backend не поддерживает lte фильтр, поэтому загружаем все концепты и фильтруем на клиенте
 */
export async function getDomainConceptsTree(maxDepth: number = 2, languageCode: string = 'ru') {
  const query = `
    query GetDomainTree {
      concepts {
        id
        path
        depth
        parentId
        dictionaries {
          name
          description
          language {
            code
          }
        }
      }
    }
  `;

  const response = await graphqlClient.request<{ concepts: DomainConcept[] }>(query);

  // Фильтруем по глубине на клиенте
  const filtered = response.concepts.filter(c => c.depth <= maxDepth);

  // Преобразуем плоский список в дерево
  return buildTree(filtered);
}

/**
 * Поиск по доменным концептам
 */
export async function searchDomainConcepts(searchQuery: string, languageCode: string = 'ru') {
  const query = `
    query SearchDomainConcepts($query: String!, $languageCode: String!) {
      searchConcepts(query: $query, languageCode: $languageCode, limit: 100) {
        id
        path
        depth
        score
        dictionaries {
          name
          description
          language {
            code
          }
        }
      }
    }
  `;

  const response = await graphqlClient.request<{ searchConcepts: DomainConcept[] }>(query, {
    query: searchQuery,
    languageCode
  });

  return response.searchConcepts;
}

/**
 * Получить путь (breadcrumbs) для концепта
 * Рекурсивно загружает родительские концепты
 */
export async function getConceptPath(conceptId: number, languageCode: string = 'ru'): Promise<DomainConcept[]> {
  const query = `
    query GetConcept($conceptId: Int!) {
      concept(concept_id: $conceptId) {
        id
        path
        depth
        parentId
        dictionaries {
          name
        }
      }
    }
  `;

  const response = await graphqlClient.request<{ concept: DomainConcept }>(query, { conceptId });

  if (!response.concept) {
    return [];
  }

  // Собираем путь от корня к текущему концепту рекурсивно
  const breadcrumbs: DomainConcept[] = [response.concept];

  // Если есть родитель, загружаем его путь рекурсивно
  if (response.concept.parentId) {
    const parentPath = await getConceptPath(response.concept.parentId, languageCode);
    breadcrumbs.unshift(...parentPath);
  }

  return breadcrumbs;
}

/**
 * Получить статистику по онтологии
 */
export async function getDomainStatistics() {
  const query = `
    query GetDomainStatistics {
      conceptsStats {
        total
        byDepth {
          depth
          count
        }
      }
    }
  `;

  // Если статистика не реализована на backend, просто считаем концепты
  try {
    const response = await graphqlClient.request<any>(query);
    return response.conceptsStats;
  } catch (error) {
    // Fallback: просто подсчитываем концепты по уровням
    const allConcepts = await getDomainConceptsTree(10); // Загружаем все уровни
    return calculateStatistics(allConcepts);
  }
}

/**
 * Вспомогательная функция: построение дерева из плоского списка
 */
function buildTree(flatList: DomainConcept[]): DomainConcept[] {
  const map = new Map<number, DomainConcept>();
  const roots: DomainConcept[] = [];

  // Создаем мапу id -> концепт
  flatList.forEach(concept => {
    map.set(concept.id, { ...concept, children: [] });
  });

  // Строим дерево
  flatList.forEach(concept => {
    const node = map.get(concept.id)!;

    if (concept.parentId && map.has(concept.parentId)) {
      const parent = map.get(concept.parentId)!;
      if (!parent.children) parent.children = [];
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

/**
 * Вспомогательная функция: подсчет статистики
 */
function calculateStatistics(tree: DomainConcept[]) {
  const stats: { [depth: number]: number } = {};
  let total = 0;

  function traverse(nodes: DomainConcept[]) {
    nodes.forEach(node => {
      total++;
      stats[node.depth] = (stats[node.depth] || 0) + 1;
      if (node.children) {
        traverse(node.children);
      }
    });
  }

  traverse(tree);

  return {
    total,
    byDepth: Object.entries(stats).map(([depth, count]) => ({
      depth: parseInt(depth),
      count
    }))
  };
}

/**
 * Преобразовать дерево в формат для визуализации D3
 */
export function convertToD3Format(
  concepts: DomainConcept[],
  languageCode: string = 'ru'
): any {
  function transformNode(concept: DomainConcept): any {
    const name = concept.dictionaries.find(d => d.language.code === languageCode)?.name || concept.path;

    return {
      name,
      attributes: {
        id: concept.id,
        path: concept.path,
        depth: concept.depth
      },
      children: concept.children?.map(transformNode) || []
    };
  }

  return {
    name: 'Онтология аттракторов человека',
    children: concepts.map(transformNode)
  };
}
