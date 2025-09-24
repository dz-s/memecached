import { describe, it, expect, beforeEach } from 'vitest'
import { DoublyLinkedList } from '../../src/data-structures/doubly-linked-list'
import { DoublyLinkedNode } from '../../src/types'

describe('DoublyLinkedList', () => {
  let list: DoublyLinkedList<string, number>

  beforeEach(() => {
    list = new DoublyLinkedList<string, number>()
  })

  const createNode = (key: string, value: number): DoublyLinkedNode<string, number> => ({
    key,
    value,
    prev: null,
    next: null
  })

  describe('isEmpty', () => {
    it('should return true for empty list', () => {
      expect(list.isEmpty()).toBe(true)
    })

    it('should return false for non-empty list', () => {
      const node = createNode('a', 1)
      list.addFirst(node)
      expect(list.isEmpty()).toBe(false)
    })
  })

  describe('addFirst', () => {
    it('should add first node to empty list', () => {
      const node = createNode('a', 1)
      list.addFirst(node)

      expect(list.isEmpty()).toBe(false)
      expect(node.prev).toBeNull()
      expect(node.next).toBeNull()
    })

    it('should add node to beginning of non-empty list', () => {
      const node1 = createNode('a', 1)
      const node2 = createNode('b', 2)
      
      list.addFirst(node1)
      list.addFirst(node2)

      expect(node2.prev).toBeNull()
      expect(node2.next).toBe(node1)
      expect(node1.prev).toBe(node2)
      expect(node1.next).toBeNull()
    })

    it('should handle multiple nodes correctly', () => {
      const nodes = [
        createNode('a', 1),
        createNode('b', 2),
        createNode('c', 3)
      ]

      nodes.forEach(node => list.addFirst(node))

      expect(nodes[2].prev).toBeNull()
      expect(nodes[2].next).toBe(nodes[1])
      expect(nodes[1].prev).toBe(nodes[2])
      expect(nodes[1].next).toBe(nodes[0])
      expect(nodes[0].prev).toBe(nodes[1])
      expect(nodes[0].next).toBeNull()
    })
  })

  describe('remove', () => {
    it('should remove single node from list', () => {
      const node = createNode('a', 1)
      list.addFirst(node)
      list.remove(node)

      expect(list.isEmpty()).toBe(true)
      expect(node.prev).toBeNull()
      expect(node.next).toBeNull()
    })

    it('should remove first node from multi-node list', () => {
      const node1 = createNode('a', 1)
      const node2 = createNode('b', 2)
      
      list.addFirst(node1)
      list.addFirst(node2)
      list.remove(node2)

      expect(node1.prev).toBeNull()
      expect(node1.next).toBeNull()
      expect(node2.prev).toBeNull()
      expect(node2.next).toBeNull()
    })

    it('should remove last node from multi-node list', () => {
      const node1 = createNode('a', 1)
      const node2 = createNode('b', 2)
      
      list.addFirst(node1)
      list.addFirst(node2)
      list.remove(node1)

      expect(node2.prev).toBeNull()
      expect(node2.next).toBeNull()
      expect(node1.prev).toBeNull()
      expect(node1.next).toBeNull()
    })

    it('should remove middle node from multi-node list', () => {
      const node1 = createNode('a', 1)
      const node2 = createNode('b', 2)
      const node3 = createNode('c', 3)
      
      list.addFirst(node1)
      list.addFirst(node2)
      list.addFirst(node3)
      list.remove(node2)

      expect(node3.next).toBe(node1)
      expect(node1.prev).toBe(node3)
      expect(node2.prev).toBeNull()
      expect(node2.next).toBeNull()
    })
  })

  describe('removeLast', () => {
    it('should return null for empty list', () => {
      const result = list.removeLast()
      expect(result).toBeNull()
    })

    it('should remove and return single node', () => {
      const node = createNode('a', 1)
      list.addFirst(node)
      
      const result = list.removeLast()
      
      expect(result).toBe(node)
      expect(list.isEmpty()).toBe(true)
      expect(node.prev).toBeNull()
      expect(node.next).toBeNull()
    })

    it('should remove last node from multi-node list', () => {
      const node1 = createNode('a', 1)
      const node2 = createNode('b', 2)
      const node3 = createNode('c', 3)
      
      list.addFirst(node1)
      list.addFirst(node2)
      list.addFirst(node3)
      
      const result = list.removeLast()
      
      expect(result).toBe(node1)
      expect(node2.next).toBeNull()
      expect(node1.prev).toBeNull()
      expect(node1.next).toBeNull()
    })
  })

  describe('moveToFirst', () => {
    it('should move single node to first position', () => {
      const node = createNode('a', 1)
      list.addFirst(node)
      list.moveToFirst(node)

      expect(list.isEmpty()).toBe(false)
      expect(node.prev).toBeNull()
      expect(node.next).toBeNull()
    })

    it('should move last node to first position', () => {
      const node1 = createNode('a', 1)
      const node2 = createNode('b', 2)
      
      list.addFirst(node1)
      list.addFirst(node2)
      list.moveToFirst(node1)

      expect(node1.prev).toBeNull()
      expect(node1.next).toBe(node2)
      expect(node2.prev).toBe(node1)
      expect(node2.next).toBeNull()
    })

    it('should move middle node to first position', () => {
      const node1 = createNode('a', 1)
      const node2 = createNode('b', 2)
      const node3 = createNode('c', 3)
      
      list.addFirst(node1)
      list.addFirst(node2)
      list.addFirst(node3)
      list.moveToFirst(node2)

      expect(node2.prev).toBeNull()
      expect(node2.next).toBe(node3)
      expect(node3.prev).toBe(node2)
      expect(node3.next).toBe(node1)
      expect(node1.prev).toBe(node3)
      expect(node1.next).toBeNull()
    })

    it('should handle moving already first node', () => {
      const node1 = createNode('a', 1)
      const node2 = createNode('b', 2)
      
      list.addFirst(node1)
      list.addFirst(node2)
      list.moveToFirst(node2)

      expect(node2.prev).toBeNull()
      expect(node2.next).toBe(node1)
      expect(node1.prev).toBe(node2)
      expect(node1.next).toBeNull()
    })
  })

  describe('complex operations', () => {
    it('should handle sequence of operations correctly', () => {
      const nodeA = createNode('a', 1)
      const nodeB = createNode('b', 2)
      const nodeC = createNode('c', 3)
      
      list.addFirst(nodeA)
      expect(list.isEmpty()).toBe(false)
      
      list.addFirst(nodeB)
      list.addFirst(nodeC)
      
      list.moveToFirst(nodeA)
      expect(nodeA.prev).toBeNull()
      expect(nodeA.next).toBe(nodeC)
      
      const removed = list.removeLast()
      expect(removed).toBe(nodeB)
      expect(nodeC.next).toBeNull()
      
      list.remove(nodeC)
      expect(nodeA.prev).toBeNull()
      expect(nodeA.next).toBeNull()
      
      list.remove(nodeA)
      expect(list.isEmpty()).toBe(true)
    })

    it('should maintain proper links after multiple operations', () => {
      const nodes = Array.from({ length: 5 }, (_, i) => createNode(`node${i}`, i))
      
      nodes.forEach(node => list.addFirst(node))
      
      list.moveToFirst(nodes[2])
      list.remove(nodes[1])
      list.moveToFirst(nodes[0])
      
      expect(nodes[0].prev).toBeNull()
      expect(nodes[0].next).toBe(nodes[2])
      expect(nodes[2].prev).toBe(nodes[0])
    })
  })

  describe('edge cases', () => {
    it('should handle removing node not in list gracefully', () => {
      const node1 = createNode('a', 1)
      const node2 = createNode('b', 2)
      
      list.addFirst(node1)
      
      expect(() => list.remove(node2)).not.toThrow()
      expect(list.isEmpty()).toBe(false)
    })

    it('should maintain consistency after removing all nodes one by one', () => {
      const nodes = Array.from({ length: 3 }, (_, i) => createNode(`node${i}`, i))
      
      nodes.forEach(node => list.addFirst(node))
      nodes.forEach(node => list.remove(node))
      
      expect(list.isEmpty()).toBe(true)
      nodes.forEach(node => {
        expect(node.prev).toBeNull()
        expect(node.next).toBeNull()
      })
    })

    it('should handle removeLast until empty', () => {
      const nodes = Array.from({ length: 3 }, (_, i) => createNode(`node${i}`, i))
      
      nodes.forEach(node => list.addFirst(node))
      
      while (!list.isEmpty()) {
        const removed = list.removeLast()
        expect(removed).toBeTruthy()
        expect(removed!.prev).toBeNull()
        expect(removed!.next).toBeNull()
      }
      
      expect(list.removeLast()).toBeNull()
    })
  })
})
