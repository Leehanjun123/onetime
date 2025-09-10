#!/usr/bin/env node

/**
 * Console.log를 Winston 로거로 자동 교체하는 스크립트
 * 안전한 단계별 교체를 수행합니다.
 */

const fs = require('fs');
const path = require('path');

class ConsoleReplacer {
  constructor() {
    this.replacements = {
      'console.log': 'logger.info',
      'console.info': 'logger.info', 
      'console.warn': 'logger.warn',
      'console.error': 'logger.error',
      'console.debug': 'logger.debug'
    };
    
    this.processedFiles = 0;
    this.totalReplacements = 0;
    this.loggerImportPattern = /const.*logger.*require.*logger/;
    this.skipPatterns = [
      /node_modules/,
      /coverage/,
      /\.git/,
      /build/,
      /dist/,
      /public/,
      /workbox/,
      /test/,
      // 테스트 파일은 console.log 허용
      /\.test\.js$/,
      /\.spec\.js$/
    ];
  }

  shouldSkipFile(filePath) {
    return this.skipPatterns.some(pattern => pattern.test(filePath));
  }

  /**
   * 파일에 logger import가 있는지 확인
   */
  hasLoggerImport(content) {
    return this.loggerImportPattern.test(content) || 
           content.includes("require('../utils/logger')") ||
           content.includes("require('./utils/logger')") ||
           content.includes('logger') && content.includes('require');
  }

  /**
   * logger import 추가
   */
  addLoggerImport(content, filePath) {
    // 이미 logger import가 있으면 추가하지 않음
    if (this.hasLoggerImport(content)) {
      return content;
    }

    // 파일 경로에 따라 적절한 상대 경로 계산
    const srcDir = path.join(process.cwd(), 'src');
    const relativePath = path.relative(path.dirname(filePath), srcDir);
    const importPath = relativePath ? `${relativePath}/utils/logger` : './utils/logger';
    
    // 다른 require문들 찾기
    const requireLines = content.match(/^const .* = require\(.+\);?$/gm);
    
    if (requireLines && requireLines.length > 0) {
      // 마지막 require문 다음에 logger import 추가
      const lastRequire = requireLines[requireLines.length - 1];
      const loggerImport = `const { logger } = require('${importPath}');`;
      
      // 이미 logger import가 있는지 다시 확인
      if (content.includes(loggerImport)) {
        return content;
      }
      
      return content.replace(lastRequire, lastRequire + '\n' + loggerImport);
    } else {
      // require문이 없으면 파일 시작 부분에 추가
      const loggerImport = `const { logger } = require('${importPath}');\n\n`;
      return loggerImport + content;
    }
  }

  /**
   * console.* 호출을 logger.*로 교체
   */
  replaceConsoleCalls(content) {
    let replacementCount = 0;
    let newContent = content;

    Object.entries(this.replacements).forEach(([oldCall, newCall]) => {
      const pattern = new RegExp(`\\b${oldCall.replace('.', '\\.')}\\b`, 'g');
      const matches = newContent.match(pattern);
      
      if (matches) {
        replacementCount += matches.length;
        newContent = newContent.replace(pattern, newCall);
      }
    });

    return { content: newContent, count: replacementCount };
  }

  /**
   * 단일 파일 처리
   */
  processFile(filePath) {
    try {
      const originalContent = fs.readFileSync(filePath, 'utf8');
      
      // console 호출이 없으면 스킵
      if (!Object.keys(this.replacements).some(call => originalContent.includes(call))) {
        return { processed: false, replacements: 0 };
      }

      let newContent = originalContent;
      
      // Step 1: logger import 추가
      newContent = this.addLoggerImport(newContent, filePath);
      
      // Step 2: console 호출 교체
      const result = this.replaceConsoleCalls(newContent);
      
      // 변경사항이 있으면 파일 저장
      if (result.count > 0) {
        fs.writeFileSync(filePath, result.content, 'utf8');
        console.log(`✅ ${filePath}: ${result.count}개 교체 완료`);
        
        this.processedFiles++;
        this.totalReplacements += result.count;
        
        return { processed: true, replacements: result.count };
      }
      
      return { processed: false, replacements: 0 };
      
    } catch (error) {
      console.error(`❌ ${filePath} 처리 중 오류:`, error.message);
      return { processed: false, replacements: 0, error: error.message };
    }
  }

  /**
   * 디렉토리 재귀 처리
   */
  processDirectory(dirPath) {
    const entries = fs.readdirSync(dirPath);
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry);
      
      if (this.shouldSkipFile(fullPath)) {
        continue;
      }
      
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        this.processDirectory(fullPath);
      } else if (stat.isFile() && entry.endsWith('.js')) {
        this.processFile(fullPath);
      }
    }
  }

  /**
   * 메인 실행 함수
   */
  run(targetPath = './src') {
    console.log('🔄 Console.log를 Winston 로거로 교체 시작...');
    console.log(`📁 대상 디렉토리: ${targetPath}`);
    
    const startTime = Date.now();
    
    if (fs.statSync(targetPath).isDirectory()) {
      this.processDirectory(targetPath);
    } else {
      this.processFile(targetPath);
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log('\n📊 처리 완료 요약:');
    console.log(`✅ 처리된 파일: ${this.processedFiles}개`);
    console.log(`🔄 총 교체 수: ${this.totalReplacements}개`);
    console.log(`⏱️ 소요 시간: ${duration}ms`);
    
    if (this.totalReplacements > 0) {
      console.log('\n📝 다음 단계:');
      console.log('1. npm test를 실행하여 변경사항이 올바른지 확인');
      console.log('2. 수동으로 생성된 로그 메시지 검토 및 개선');
      console.log('3. ESLint 규칙으로 console 사용 금지 설정');
    }
    
    return {
      processedFiles: this.processedFiles,
      totalReplacements: this.totalReplacements,
      duration
    };
  }
}

// CLI 실행
if (require.main === module) {
  const targetPath = process.argv[2] || './src';
  const replacer = new ConsoleReplacer();
  
  console.log('⚠️  주의: 이 스크립트는 파일을 직접 수정합니다.');
  console.log('💾 변경 전 백업을 권장합니다.');
  console.log('');
  
  // 3초 대기 후 시작
  setTimeout(() => {
    try {
      const result = replacer.run(targetPath);
      process.exit(0);
    } catch (error) {
      console.error('❌ 스크립트 실행 중 오류:', error);
      process.exit(1);
    }
  }, 1000);
}

module.exports = ConsoleReplacer;