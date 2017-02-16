package io.yetanotherwhatever;

import java.util.*;
import java.util.stream.Collectors;

import static org.junit.Assert.assertTrue;

/**
 * Created by achang on 1/12/2017.
 */
public class GakkiTest {
    @org.junit.Test
    public void genGakki() throws Exception {

        for (int i = 0; i < 1000; i++)
        {
            assertTrue(Gakki.isGakki(Gakki.genGakki()));
        }

    }

    @org.junit.Test
    public void genTestInput() throws Exception
    {

        int failCount = 0;
        int successCount = 0;
        for (int i = 0; i < 5000; i++) {
            String gakki = Gakki.genGakki();

            String obf = Gakki.addRandChars(gakki);

            String attempt = Gakki.gakkify(obf);

            assertTrue(attempt.equals(gakki));
        }
    }



    @org.junit.Test
    public void randChar() throws Exception {

        HashMap<Character, Integer> map = new HashMap();

        int count = 0;

        //keep trying until we've generated every char >= MIN_CHAR, < MAX_CHAR
        for (int i = 0; i < 10000; i++)
        {
            char c = Gakki.randChar();
            if (map.get(c) == null)
            {
                map.put(c, 1);
                count++;
            }

            if (count == Gakki.MAX_CHAR - Gakki.MIN_CHAR)
                break;
        }

        assertTrue(count == Gakki.MAX_CHAR - Gakki.MIN_CHAR);
    }

    @org.junit.Test
    public void removeChars() throws Exception
    {
        String filtered = Gakki.removeChars("ab&&abddddd]]", stringToSet("d&]"));
        assertTrue("abab".equals(filtered));

        filtered = Gakki.removeChars("a77777777bc345789", stringToSet("345789"));
        assertTrue("abc".equals(filtered));

        filtered = Gakki.removeChars("abc", stringToSet("d"));
        assertTrue("abc".equals(filtered));

        filtered = Gakki.removeChars("", stringToSet("abdd"));
        assertTrue("".equals(filtered));

        filtered = Gakki.removeChars("aawgoiwahousadhgoaihegw", stringToSet(""));
        assertTrue("aawgoiwahousadhgoaihegw".equals(filtered));

        //special regex chars
        filtered = Gakki.removeChars("aawgo.iw.ah.ou..*sadhgoaihegw", stringToSet(".*"));
        assertTrue("aawgoiwahousadhgoaihegw".equals(filtered));
    }

    @org.junit.Test
    public void gakkify() throws Exception {


        for (int i = 0; i < 1000; i++)
        {
            assertTrue(Gakki.isGakki(Gakki.genGakki()));
        }


    }

    @org.junit.Test
    public void isGakki() throws Exception {
        assertTrue(Gakki.isGakki("abab"));
        assertTrue(Gakki.isGakki("acacacacac"));
        assertTrue(Gakki.isGakki("acacacacaca"));


        assertTrue(!Gakki.isGakki("ab"));
        assertTrue(!Gakki.isGakki("aba"));
        assertTrue(!Gakki.isGakki("abc"));
        assertTrue(!Gakki.isGakki("abbab"));


    }

    @org.junit.Test
    public void getUniqueChars() throws Exception {

        uniques("H7Z7HaZaH7Z7", "H7Za");
        uniques("Z@f@ZBfBZ@f@ZbfbZ@f@ZbfbZB", "Z@fBb");
        uniques("mW;Wm[;[m#;#mW;Wm[;[mW;Wm[;[mW;WmN;Nm[;[mW;Wm#;#m[", "mW;[#N");
        uniques(":;q;:0q0:;q;", ":;q0");
        uniques("lE<Ell<llE<Ell<llE<E", "lE<");
        uniques("Mc*cM7*7Mc*cM8*8M7*7M8*8", "Mc*78");
        uniques("c\\q\\c=q=c\\q\\c=q=c\\q\\c^q^c\\q\\c^q^c@q@c\\q\\c^q^c=q=", "c\\q=^@");
    }

    void uniques(String in, String expected)
    {
        String out = setToString(Gakki.getUniqueChars(in));
        assertTrue (sort(out).equals(sort(expected)));
    }

    static protected Set stringToSet(String str)
    {
        Set<Character> charsSet = str.chars().mapToObj(e->(char)e).collect(Collectors.toSet());

        return charsSet;
    }

    static protected String setToString(Set s)
    {
        Iterator i = s.iterator();

        StringBuilder sb = new StringBuilder();
        while (i.hasNext())
        {
            sb.append(i.next());
        }

        return sb.toString();
    }



    String sort(String in)
    {
        char[] chars = in.toCharArray();
        Arrays.sort(chars);
        return new String(chars);
    }

    @org.junit.Test
    public void getTwoLetterCombos() throws Exception {

        checkCombos("H7Za");
        checkCombos("Z@fBb");
        checkCombos("mW;[#N");
        checkCombos(":;q0");
        checkCombos("lE<");
        checkCombos("Mc*78");
        checkCombos("c\\q=^@");
    }

    void checkCombos(String in)
    {
        ArrayList<String> combos = Gakki.getTwoLetterCombos(stringToSet(in));

        int expectedSize = in.length() * (in.length()-1) /2;


        //order of letters does not matter (ie. "ab" == "ba"), for dedupe purps.
        List<String> deduped = combos.stream().map(GakkiTest::alphabetize).collect(Collectors.toList());
        //should all be unique
        HashSet hs = new HashSet();
        hs.addAll(deduped);
        deduped.clear();
        deduped.addAll(hs);

        assertTrue(deduped .size() == expectedSize);
    }

    public static String alphabetize(String in)
    {
        char[] chars = in.toCharArray();
        Arrays.sort(chars);
        return new String(chars);
    }

}