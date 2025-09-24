import { DoublyLinkedNode } from '../types'

export class DoublyLinkedList<K, V> {
  private head: DoublyLinkedNode<K, V> | null = null
  private tail: DoublyLinkedNode<K, V> | null = null
  
  addFirst(node: DoublyLinkedNode<K, V>): void {
    if (!this.head) {
      this.head = this.tail = node
      node.prev = node.next = null
    } else {
      node.next = this.head
      node.prev = null
      this.head.prev = node
      this.head = node
    }
  }
  
  remove(node: DoublyLinkedNode<K, V>): void {
    if (node.prev === null && node.next === null && this.head !== node) {
      return
    }
    
    if (node.prev) {
      node.prev.next = node.next
    } else {
      this.head = node.next
    }
    
    if (node.next) {
      node.next.prev = node.prev
    } else {
      this.tail = node.prev
    }
    
    node.prev = node.next = null
  }
  
  removeLast(): DoublyLinkedNode<K, V> | null {
    if (!this.tail) return null
    
    const node = this.tail
    this.remove(node)
    return node
  }
  
  moveToFirst(node: DoublyLinkedNode<K, V>): void {
    this.remove(node)
    this.addFirst(node)
  }
  
  isEmpty(): boolean {
    return this.head === null
  }
}
