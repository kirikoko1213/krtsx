#!/bin/bash

echo "=== 测试多行输出 ==="
echo "第一行输出"
echo "第二行输出"
echo "第三行输出"
echo ""
echo "=== 测试 ls -l 输出 ==="
ls -l .
echo ""
echo "=== 测试带空格的输出 ==="
echo "    这是带前导空格的行"
echo "	这是带制表符的行"
echo ""
echo "=== 测试完成 ===" 